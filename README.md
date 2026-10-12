# 로컬 로그인 연습 프로젝트

학교의 공식 서비스와 연결되지 않는 연습용 화면입니다. 새로 만든 테스트 아이디와 비밀번호만 사용하세요.

## 실행

Node.js 24 이상을 사용합니다. 현재 설치된 Node.js 24.15.0에서 확인했습니다.

```powershell
cd "C:\Users\김정우\OneDrive\Desktop\hack"
npm run db:init
npm run dev
```

http://127.0.0.1:3000 에서 먼저 **연습용 계정 등록**을 누르고 아이디와 비밀번호를 등록합니다. 이후 같은 정보로 로그인하면 페이지 이동 없이 **로그인 성공** 팝업이 뜹니다.

- 아이디: 3~32자, 한글·영문·숫자·점·밑줄·하이픈
- 비밀번호: 8~128자
- 입력 항목은 `username`, `password` 두 가지입니다.
- 등록 성공, 중복 아이디, 로그인 실패, 연결 오류를 팝업으로 안내합니다.
- 비밀번호 입력은 요청 처리 후 비워지고, 비밀번호 원문은 DB나 로그에 저장하지 않습니다.

## 백엔드와 DB

Next.js 서버에 `POST /api/auth/register`, `POST /api/auth/login`이 있습니다. 두 API는 JSON `{ "username": "demo_user", "password": "practice123!" }`을 받습니다.

SQLite DB는 첫 요청 또는 `npm run db:init` 시 `data/demo.sqlite`에 생성됩니다. `users` 테이블에는 `username`, `password_hash` 두 열만 저장합니다. 비밀번호는 무작위 salt와 scrypt로 해시하고, SQL에는 매개변수 바인딩을 사용합니다. `attempts` 테이블은 요청 횟수 제한을 관리합니다. DB 파일은 Git에서 제외합니다.

성공 응답은 계정 확인 결과를 표시하는 용도입니다. 현재 별도 보호 페이지나 로그인 유지 세션은 없습니다. 학교 사이트로 자동 이동하거나 학교 계정으로 인증하지 않습니다.

로컬 주소에서만 인증 API를 사용할 수 있고 실행 서버도 기본적으로 `127.0.0.1`에 바인딩합니다. DB는 로컬 연습용 파일이며 다른 저장 위치가 필요하면 `DEMO_DB_PATH` 환경 변수를 지정할 수 있습니다. Node.js 버전에 따라 내장 SQLite에 관한 실험적 기능 안내가 나타날 수 있습니다.

검증 명령: `npm run test:auth`, `npm run lint`, `npm run build`.

참고: [Node.js SQLite](https://nodejs.org/download/release/v24.15.0/docs/api/sqlite.html), [Node.js Crypto](https://nodejs.org/download/release/v24.15.0/docs/api/crypto.html).
