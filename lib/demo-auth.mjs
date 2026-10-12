import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

let database;

export function initDatabase() {
  if (database) return database;
  // 로컬에서 생성하는 DB 경로는 배포 파일 추적에 포함하지 않습니다.
  const file = resolve(/* turbopackIgnore: true */ process.env.DEMO_DB_PATH || "data/demo.sqlite");
  mkdirSync(dirname(file), { recursive: true });
  database = new DatabaseSync(file);
  database.exec(`
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS attempts (
      bucket TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    ) STRICT;
  `);
  return database;
}

function reply(status, code, message) {
  return Response.json({ code, message }, {
    status, headers: { "Cache-Control": "no-store" },
  });
}

function consumeAttempt(bucket, limit, period) {
  const db = initDatabase();
  const now = Date.now();
  db.prepare("DELETE FROM attempts WHERE expires_at <= ?").run(now);
  const row = db.prepare(`
    INSERT INTO attempts (bucket, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(bucket) DO UPDATE SET count = count + 1
    RETURNING count
  `).get(bucket, now + period);
  return row.count <= limit;
}

function derive(password, salt) {
  return new Promise((accept, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else accept(key);
    });
  });
}

async function readCredentials(request) {
  if (!request.body) throw new Error("empty");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw new RangeError("body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function handleAuth(request, action) {
  try {
    const url = new URL(request.url);
    // Next.js가 내부 URL을 localhost로 정규화해도 실제 요청 주소를 비교합니다.
    const publicUrl = new URL(`${url.protocol}//${request.headers.get("host") || url.host}`);
    const origin = request.headers.get("origin");
    if (!['localhost', '127.0.0.1', '[::1]'].includes(publicUrl.hostname)) {
      return reply(403, "LOCAL_ONLY", "로컬 연습용 서버에서만 사용할 수 있습니다.");
    }
    if ((origin && origin !== publicUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site") {
      return reply(403, "BAD_ORIGIN", "허용되지 않은 요청입니다.");
    }
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
      return reply(415, "JSON_REQUIRED", "JSON 형식으로 보내 주세요.");
    }
    if (Number(request.headers.get("content-length")) > 4096) {
      return reply(413, "BODY_TOO_LARGE", "입력값이 너무 큽니다.");
    }
    if (!consumeAttempt("all-requests", 30, 60_000)) {
      return reply(429, "RATE_LIMITED", "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
    }
    let input;
    try {
      input = await readCredentials(request);
    } catch (error) {
      return reply(error instanceof RangeError ? 413 : 400, "INVALID_BODY", "입력 형식을 확인해 주세요.");
    }
    if (!input || typeof input !== "object" || Array.isArray(input)
      || Object.keys(input).some((key) => !["username", "password"].includes(key))
      || typeof input.username !== "string" || typeof input.password !== "string") {
      return reply(400, "INVALID_BODY", "아이디와 비밀번호 두 항목만 입력해 주세요.");
    }
    const username = input.username.trim();
    const password = input.password;
    if (!/^[a-zA-Z0-9가-힣._-]{3,32}$/u.test(username)) {
      return reply(400, "INVALID_USERNAME", "아이디는 한글, 영문, 숫자, 점, 밑줄, 하이픈으로 3~32자 입력해 주세요.");
    }
    if (password.length < 8 || password.length > 128 || Buffer.byteLength(password) > 512) {
      return reply(400, "INVALID_PASSWORD", "연습용 비밀번호를 8~128자로 입력해 주세요.");
    }
    const db = initDatabase();
    if (action === "register") {
      const salt = randomBytes(16).toString("hex");
      const key = await derive(password, salt);
      const hash = `scrypt$32768$8$1$${salt}$${key.toString("hex")}`;
      const result = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?) ON CONFLICT(username) DO NOTHING").run(username, hash);
      if (!result.changes) return reply(409, "USERNAME_TAKEN", "이미 등록된 연습용 아이디입니다.");
      return reply(201, "REGISTERED", "연습용 계정이 등록되었습니다. 같은 아이디와 비밀번호로 로그인해 주세요.");
    }
    if (action !== "login") return reply(400, "INVALID_ACTION", "지원하지 않는 요청입니다.");
    const bucket = `login:${username}`;
    if (!consumeAttempt(bucket, 5, 10 * 60_000)) {
      return reply(429, "RATE_LIMITED", "로그인 시도가 너무 많습니다. 10분 후 다시 시도해 주세요.");
    }
    const user = db.prepare("SELECT password_hash FROM users WHERE username = ?").get(username);
    // 존재하지 않는 계정도 같은 해시 연산을 수행합니다.
    const parts = user?.password_hash.split("$");
    const salt = parts?.[4] || "0".repeat(32);
    const expected = parts ? Buffer.from(parts[5], "hex") : Buffer.alloc(64);
    const actual = await derive(password, salt);
    if (!user || expected.length !== actual.length || !timingSafeEqual(actual, expected)) {
      return reply(401, "INVALID_CREDENTIALS", "아이디 또는 비밀번호가 일치하지 않습니다.");
    }
    db.prepare("DELETE FROM attempts WHERE bucket = ?").run(bucket);
    return reply(200, "LOGGED_IN", "연습용 계정으로 로그인에 성공했습니다.");
  } catch {
    return reply(500, "SERVER_ERROR", "서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.");
  }
}
