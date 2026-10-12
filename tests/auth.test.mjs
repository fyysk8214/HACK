import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, test } from "node:test";

const folder = mkdtempSync(join(tmpdir(), "practice-auth-"));
process.env.DEMO_DB_PATH = join(folder, "test.sqlite");
const { handleLogin, addPracticeAccount, initDatabase } = await import("../lib/demo-auth.mjs");
after(() => { initDatabase().close(); rmSync(folder, { recursive: true, force: true }); });

function request(input, headers = {}) {
  return new Request("http://127.0.0.1:3000/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(input),
  });
}

test("seeded account, login, duplicate seed, incorrect password, and hashed storage", async () => {
  const input = { username: "demo_user", password: "practice123!" };
  assert.equal(await addPracticeAccount(input.username, input.password), true);
  assert.equal(await addPracticeAccount(input.username, "different123!"), false);
  assert.equal((await handleLogin(request(input))).status, 200);
  assert.equal((await handleLogin(request({ ...input, password: "incorrect123" }))).status, 401);
  assert.equal((await handleLogin(request({ ...input, username: "unknown_user" }))).status, 401);
  const db = new DatabaseSync(process.env.DEMO_DB_PATH);
  const stored = db.prepare("SELECT * FROM users WHERE username = ?").get(input.username);
  assert.deepEqual(Object.keys(stored), ["username", "password_hash"]);
  assert.match(stored.password_hash, /^scrypt\$32768\$8\$1\$/);
  assert.ok(!stored.password_hash.includes(input.password));
  db.close();
});

test("invalid values, extra fields, cross-site requests, and oversized bodies", async () => {
  assert.equal((await handleLogin(request({ username: "ab", password: "practice123!" }))).status, 400);
  assert.equal((await handleLogin(request({ username: "demo", password: "123" }))).status, 400);
  assert.equal((await handleLogin(request({ username: "demo", password: "practice123!", email: "ignored" }))).status, 400);
  assert.equal((await handleLogin(request({ username: "demo", password: "practice123!" }, { Origin: "https://other.example" }))).status, 403);
  assert.equal((await handleLogin(request({ username: "demo", password: "a".repeat(5000) }))).status, 413);
  assert.equal((await handleLogin(new Request("http://127.0.0.1:3000", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status, 400);
  assert.equal((await handleLogin(request({}, { "Content-Type": "text/plain" }))).status, 415);
});

test("repeated failed login attempts are limited", async () => {
  for (let index = 0; index < 5; index++) {
    assert.equal((await handleLogin(request({ username: "rate_test", password: "incorrect123" }))).status, 401);
  }
  assert.equal((await handleLogin(request({ username: "rate_test", password: "incorrect123" }))).status, 429);
});

test("Next.js internal localhost URL respects the public loopback Host and Origin", async () => {
  const normalized = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Host: "127.0.0.1:3000", Origin: "http://127.0.0.1:3000" },
    body: JSON.stringify({ username: "demo_user", password: "practice123!" }),
  });
  assert.equal((await handleLogin(normalized)).status, 200);
  assert.equal((await handleLogin(request({}, { Host: "external.example:3000" }))).status, 403);
});
