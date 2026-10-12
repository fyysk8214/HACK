# 로컬 로그인 연습 프로젝트

학교의 공식 서비스와 연결되지 않는 연습용 화면입니다. 새로 만든 테스트 아이디와 비밀번호만 사용하세요.

## 실행

Node.js 24 이상을 사용합니다. 현재 설치된 Node.js 24.15.0에서 확인했습니다.

```powershell
cd "C:\Users\김정우\OneDrive\Desktop\hack"
npm run db:init
npm run db:seed
npm run dev
```

http://127.0.0.1:3000 에서 **아이디 `practice01`, 비밀번호 `Practice2026!`**로 로그인하면 페이지 이동 없이 **로그인 성공** 팝업이 뜹니다. 화면이나 API를 통한 계정 등록 기능은 없습니다. 서버 시작 시 `practice01` 연습 계정을 자동으로 준비하며, 운영자가 `npm run db:seed`로 미리 준비할 수도 있습니다. 이미 있는 계정의 비밀번호는 변경하지 않습니다.

- 아이디: 3~32자, 한글·영문·숫자·점·밑줄·하이픈
- 비밀번호: 8~128자
- 입력 항목은 `username`, `password` 두 가지입니다.
- 로그인 성공, 로그인 실패, 연결 오류를 팝업으로 안내합니다.
- 비밀번호 입력은 요청 처리 후 비워지고, 비밀번호 원문은 DB나 로그에 저장하지 않습니다.

## 백엔드와 DB

Next.js 서버의 `POST /api/auth/login`은 JSON `{ "username": "practice01", "password": "Practice2026!" }`을 받습니다. `POST /api/auth/register`는 제공하지 않습니다.

SQLite DB는 첫 요청 또는 `npm run db:init` 시 `data/demo.sqlite`에 생성됩니다. `users` 테이블에는 `username`, `password_hash` 두 열만 저장합니다. 비밀번호는 무작위 salt와 scrypt로 해시하고, SQL에는 매개변수 바인딩을 사용합니다. `attempts` 테이블은 요청 횟수 제한을 관리합니다. DB 파일은 Git에서 제외합니다.

성공 응답은 계정 확인 결과를 표시하는 용도입니다. 현재 별도 보호 페이지나 로그인 유지 세션은 없습니다. 학교 사이트로 자동 이동하거나 학교 계정으로 인증하지 않습니다.

인증 API는 로컬 주소와 지정된 HTTPS 배포 주소 `https://port-next-hack-mqjicw77f2ecd392.sel3.cloudtype.app`에서 사용할 수 있습니다. 배포 요청은 Host와 Origin을 확인하고, 다른 도메인이나 교차 사이트 요청은 차단합니다. 로컬 실행 서버는 기본적으로 `127.0.0.1`에 바인딩합니다. DB는 로컬 연습용 파일이며 다른 저장 위치가 필요하면 `DEMO_DB_PATH` 환경 변수를 지정할 수 있습니다. Node.js 버전에 따라 내장 SQLite에 관한 실험적 기능 안내가 나타날 수 있습니다.

검증 명령: `npm run test:auth`, `npm run lint`, `npm run build`.

참고: [Node.js SQLite](https://nodejs.org/download/release/v24.15.0/docs/api/sqlite.html), [Node.js Crypto](https://nodejs.org/download/release/v24.15.0/docs/api/crypto.html).

## 클라우드 빌드 경로

Windows에서는 OneDrive의 기존 캐시와 충돌하지 않도록 `.next-local`에 빌드합니다. 클라우드타입의 Linux 환경에서는 기본 `.next`에 빌드합니다. 클라우드타입의 Output Directory는 기본값 `.next`를 사용하고, GitHub 저장소 `fyysk8214/HACK`의 `codex/local-login` 브랜치를 선택하세요.

이 경로 설정은 빌드 결과물 복사 오류를 해결합니다. 클라우드타입에서는 Node.js 24 이상, HTTP 포트 3000, 실행 명령 `npx next start --hostname 0.0.0.0 --port 3000`을 사용합니다. 서버 초기화 시 고정 연습 계정이 자동 생성되며, 이미 있는 계정의 비밀번호는 덮어쓰지 않습니다.
