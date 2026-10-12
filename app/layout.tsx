import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "연습용 로그인",
  description: "I-Class 로그인 화면 연습 프로젝트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
