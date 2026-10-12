"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";

// 전달받은 로고, 캐릭터, 코스모스 원본 이미지입니다.
const images = {
  logo: "/images/logo.png",
  mascot: "/images/character.png",
  cosmos: "/images/cosmos.png",
};

const notices = [
  "(중요!) 2026-2학기 영남대학교 학점교류 교과목 중간고사 일정 안내",
  "[교수학습개발센터] ★2026-2학기「학기 중 강의진단」시행 안내★_컨설팅",
  "(학생용) 인하대 AI활용 윤리 가이드라인",
  "(교수용) 인하대 AI활용 윤리 가이드라인",
];

const shortcuts = [
  { name: "인하대학교", icon: "school", href: "https://www.inha.ac.kr/" },
  { name: "인하포털", icon: "portal", href: "https://portal.inha.ac.kr/" },
  { name: "정석학술정보관", icon: "link" },
  { name: "수강신청", icon: "target" },
  { name: "인하광장", icon: "globe" },
  { name: "Brit.G 시스템", icon: "network" },
];

function ShortcutIcon({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {kind === "school" && <><path d="m3 8 9-5 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>}
      {kind === "portal" && <><rect x="3" y="3" width="18" height="18" /><path d="M9 3v18M6 6v1m0 3v1m0 3v1m0 3v1" /></>}
      {kind === "link" && <><path d="m9 15 6-6M8 13l-2 2a3 3 0 0 0 4 4l4-4a3 3 0 0 0 0-4M16 11l2-2a3 3 0 0 0-4-4l-4 4a3 3 0 0 0 0 4" /></>}
      {kind === "target" && <><circle cx="12" cy="12" r="8" /><path d="M12 1v22M1 12h22" /></>}
      {kind === "globe" && <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M5 7h14M5 17h14" /></>}
      {kind === "network" && <><path d="m12 3 7 4 2 8-7 6-9-4-2-8 9-6Z" /><path d="m12 3 2 18M3 9l18 6M5 17 19 7" /><circle cx="12" cy="3" r="2" /><circle cx="21" cy="15" r="2" /><circle cx="5" cy="17" r="2" /></>}
    </svg>
  );
}

export default function LoginScreen() {
  const [language, setLanguage] = useState("ko");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ title: "", text: "" });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const rememberRef = useRef<HTMLInputElement>(null);
  const isEnglish = language === "en";

  useEffect(() => {
    try {
      const savedUsername = localStorage.getItem("local-practice-username");
      if (savedUsername && usernameRef.current && rememberRef.current) {
        usernameRef.current.value = savedUsername;
        rememberRef.current.checked = true;
      }
    } catch { /* 브라우저가 저장소를 차단해도 화면을 사용할 수 있습니다. */ }
  }, []);

  function showMessage(title: string, text: string) {
    setMessage({ title, text });
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }

  function showPlaceholder(title: string) {
    showMessage(title, isEnglish ? "This page is being prepared." : "이 화면은 준비 중입니다.");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const password = form.elements.namedItem("password") as HTMLInputElement;
    const username = usernameRef.current?.value.trim() ?? "";
    if (!username || !password.value) {
      showMessage(isEnglish ? "Check input" : "입력 확인", isEnglish ? "Enter a practice username and password." : "아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: password.value }),
        signal: AbortSignal.timeout(15000),
      });
      const result: { message: string; code: string } = await response.json();
      if (!response.ok) {
        showMessage(isEnglish ? "Please try again" : "요청 실패", result.message);
        return;
      }
      try {
        if (rememberRef.current?.checked) localStorage.setItem("local-practice-username", username);
        else localStorage.removeItem("local-practice-username");
      } catch { /* 저장소 접근이 제한되면 기억 기능만 생략합니다. */ }
      showMessage(isEnglish ? "Login successful" : "로그인 성공", isEnglish ? "You successfully logged in with your practice account." : result.message);
    } catch {
      showMessage(isEnglish ? "Connection error" : "연결 오류", isEnglish ? "Could not connect to the server. Please try again." : "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      password.value = "";
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <header className="site-header">
        <div className="site-logo" aria-label="인하대학교 I-Class">
          <Image className="brand-emblem" src={images.logo} alt="인하대학교 엠블럼" width={200} height={200} loading="eager" unoptimized />
          <div className="brand-wordmark">
            <span className="brand-name">인하대학교</span>
            <span className="brand-english">INHA UNIVERSITY</span>
          </div>
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-product">I-Class</span>
        </div>
        <Image className="site-mascot" src={images.mascot} alt="인하대학교 캐릭터 인덕이와 인용이" width={250} height={225} loading="eager" unoptimized />
      </header>

      <main className="main-content" aria-label="로그인">
        <div className="left-column">
          <div className="login-row">
            <section className="login-panel" aria-labelledby="login-heading">
              <div className="login-panel-heading">
                <h1 id="login-heading">LOGIN</h1>
                <label className="language-picker">
                  <span aria-hidden="true">{isEnglish ? "🇺🇸" : "🇰🇷"}</span>
                  <select aria-label="언어 선택" value={language} onChange={(event) => setLanguage(event.target.value)}>
                    <option value="ko">한국어 (ko)</option>
                    <option value="en">English (en)</option>
                  </select>
                  <span className="select-arrow" aria-hidden="true" />
                </label>
              </div>
              <form onSubmit={handleLogin} noValidate>
                <div className="credentials">
                  <div className="credential-fields">
                    <label className="sr-only" htmlFor="username">{isEnglish ? "Username" : "사용자 아이디"}</label>
                    <input id="username" name="username" ref={usernameRef} placeholder={isEnglish ? "Practice username" : "아이디"} autoComplete="off" maxLength={32} disabled={submitting} />
                    <label className="sr-only" htmlFor="password">{isEnglish ? "Password" : "비밀번호"}</label>
                    <input id="password" name="password" type="password" placeholder={isEnglish ? "Practice password" : "비밀번호"} autoComplete="off" maxLength={128} disabled={submitting} />
                  </div>
                  <button className="login-button" type="submit" disabled={submitting}>{submitting ? (isEnglish ? "Wait…" : "처리 중…") : (isEnglish ? "Log in" : "로그인")}</button>
                </div>
                <div className="login-options">
                  <label className="remember-option">
                    <input ref={rememberRef} name="remember" type="checkbox" onChange={(event) => {
                      if (!event.target.checked) {
                        try { localStorage.removeItem("local-practice-username"); } catch { /* 저장소 접근 제한 */ }
                      }
                    }} />
                    <span>{isEnglish ? "Remember me" : "사용자이름 기억"}</span>
                  </label>
                  <button className="recovery-button" type="button" onClick={() => showPlaceholder(isEnglish ? "Find ID / Password" : "아이디/비밀번호 찾기")}>
                    {isEnglish ? "Find ID / Password" : "아이디/비밀번호 찾기"}
                  </button>
                </div>
              </form>
            </section>

            <nav className="shortcut-panel" aria-label="학교 서비스 바로가기">
              {shortcuts.map((item) => item.href ? (
                <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer"><ShortcutIcon kind={item.icon} /><span>{item.name}</span></a>
              ) : (
                <button key={item.name} type="button" onClick={() => showPlaceholder(item.name)}><ShortcutIcon kind={item.icon} /><span>{item.name}</span></button>
              ))}
            </nav>
          </div>

          <section className="notice-panel" aria-labelledby="notice-heading">
            <div className="notice-heading">
              <h2 id="notice-heading">{isEnglish ? "Notices" : "공지사항"}</h2>
              <button className="notice-more" type="button" aria-label="공지사항 더 보기" onClick={() => showMessage(isEnglish ? "Notices" : "공지사항", notices.join("\n\n"))}>＋</button>
            </div>
            <ul className="notice-list">
              {notices.map((notice) => <li key={notice}><button type="button" title={notice} onClick={() => showMessage(notice, isEnglish ? "Notice content will be added later." : "공지사항 본문은 추후 추가할 예정입니다.")}>{notice}</button></li>)}
            </ul>
          </section>

          <nav className="help-links" aria-label="이용 도움말">
            {[isEnglish ? "Manual" : "매뉴얼", "Q&A", "FAQ"].map((label) => <button key={label} type="button" onClick={() => showPlaceholder(label)}><span>{label}</span><span className="chevron" aria-hidden="true">›</span></button>)}
          </nav>
          <button className="course-link" type="button" onClick={() => showPlaceholder("학과(전공)별 교과과정 및 졸업요건")}>
            <span>{isEnglish ? "Curriculum and graduation requirements" : "학과(전공)별 교과과정 및 졸업요건 바로가기"}</span><span className="chevron" aria-hidden="true">›</span>
          </button>
        </div>

        <aside className="cosmos-panel" aria-labelledby="cosmos-heading">
          <div className="cosmos-image"><Image src={images.cosmos} alt="코스모스 모바일 학습 안내" width={225} height={200} loading="eager" unoptimized /></div>
          <div className="cosmos-copy">
            <h2 id="cosmos-heading">{isEnglish ? <>Download the<br />COURSEMOS app.</> : <>코스모스 앱을<br />다운로드 받으세요.</>}</h2>
            <p>{isEnglish ? "Download COURSEMOS from Google Play or the App Store to access your learning activities on mobile. Watch videos, join discussions and chats, view files, and get notifications about course updates." : "구글 플레이 스토어 혹은 앱 스토어에서 코스모스 앱을 다운로드 받아 모바일에서도 편리하게 학습관리시스템(LMS)의 학습 활동에 참여할 수 있습니다. 동영상 시청, 토론, 채팅, 파일 뷰어 등 다양한 학습활동을 지원하며, 알림 및 채팅을 이용해서 업데이트된 소식을 확인하실 수 있습니다."}</p>
            <p className="environment-note">{isEnglish ? "* I-Class works best in Chrome on a PC. Please use the COURSEMOS app as a supplementary tool when learning with I-Class." : "* I-Class의 최적 환경은 PC 디바이스 Chrome 브라우저입니다. 코스모스 앱은 I-Class 학습시 보조로 사용해주시기 바랍니다."}</p>
            <div className="store-links">
              <a href="https://play.google.com/store/search?q=COURSEMOS&c=apps" target="_blank" rel="noopener noreferrer">Google Play <span aria-hidden="true">↗</span></a>
              <a href="https://apps.apple.com/kr/search?term=coursemos" target="_blank" rel="noopener noreferrer">App Store <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </aside>
      </main>

      <footer className="site-footer" aria-label="학교 정보">
        <a href="https://www.inha.ac.kr/kr/927/subview.do" target="_blank" rel="noopener noreferrer">
          {isEnglish ? "Privacy Policy" : "개인정보처리방침"}
        </a>
        <span>{isEnglish ? "[22212] 100 Inha-ro, Michuhol-gu, Incheon, INHA UNIVERSITY" : "[22212] 인천광역시 미추홀구 인하로 100 인하대학교"}</span>
      </footer>

      <dialog ref={dialogRef} className="info-dialog" aria-labelledby="dialog-heading" onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
        <div className="dialog-heading"><h2 id="dialog-heading">{message.title}</h2><button type="button" aria-label="닫기" onClick={() => dialogRef.current?.close()}>×</button></div>
        <p>{message.text}</p>
        <form method="dialog"><button className="dialog-confirm">{isEnglish ? "OK" : "확인"}</button></form>
      </dialog>
    </div>
  );
}
