import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, test } from "node:test";

const folder = mkdtempSync(join(tmpdir(), "practice-auth-"));
process.env.DEMO_DB_PATH = join(folder, "test.sqlite");
const { handleAuth, initDatabase } = await import("../lib/demo-auth.mjs");
after(() => { initDatabase().close(); rmSync(folder, { recursive: true, force: true }); });

function request(input, headers = {}) {
  return new Request("http://127.0.0.1:3000/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(input),
  });
}

test("register, login, duplicate account, incorrect password, and hashed storage", async () => {
  const input = { username: "demo_user", password: "practice123!" };
  assert.equal((await handleAuth(request(input), "register")).status, 201);
  assert.equal((await handleAuth(request(input), "register")).status, 409);
  assert.equal((await handleAuth(request(input), "login")).status, 200);
  assert.equal((await handleAuth(request({ ...input, password: "incorrect123" }), "login")).status, 401);
  assert.equal((await handleAuth(request({ ...input, username: "unknown_user" }), "login")).status, 401);
  const db = new DatabaseSync(process.env.DEMO_DB_PATH);
  const stored = db.prepare("SELECT * FROM users WHERE username = ?").get(input.username);
  assert.deepEqual(Object.keys(stored), ["username", "password_hash"]);
  assert.match(stored.password_hash, /^scrypt\$32768\$8\$1\$/);
  assert.ok(!stored.password_hash.includes(input.password));
  db.close();
});

test("invalid values, extra fields, cross-site requests, and oversized bodies", async () => {
  assert.equal((await handleAuth(request({ username: "ab", password: "practice123!" }), "register")).status, 400);
  assert.equal((await handleAuth(request({ username: "demo", password: "123" }), "register")).status, 400);
  assert.equal((await handleAuth(request({ username: "demo", password: "practice123!", email: "ignored" }), "register")).status, 400);
  assert.equal((await handleAuth(request({ username: "demo", password: "practice123!" }, { Origin: "https://other.example" }), "login")).status, 403);
  assert.equal((await handleAuth(request({ username: "demo", password: "a".repeat(5000) }), "register")).status, 413);
  assert.equal((await handleAuth(new Request("http://127.0.0.1:3000", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }), "register")).status, 400);
  assert.equal((await handleAuth(request({}, { "Content-Type": "text/plain" }), "login")).status, 415);
});

test("repeated failed login attempts are limited", async () => {
  for (let index = 0; index < 5; index++) {
    assert.equal((await handleAuth(request({ username: "rate_test", password: "incorrect123" }), "login")).status, 401);
  }
  assert.equal((await handleAuth(request({ username: "rate_test", password: "incorrect123" }), "login")).status, 429);
});

test("Next.js internal localhost URL respects the public loopback Host and Origin", async () => {
  const normalized = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Host: "127.0.0.1:3000", Origin: "http://127.0.0.1:3000" },
    body: JSON.stringify({ username: "demo_user", password: "practice123!" }),
  });
  assert.equal((await handleAuth(normalized, "login")).status, 200);
  assert.equal((await handleAuth(request({}, { Host: "external.example:3000" }), "login")).status, 403);
});
