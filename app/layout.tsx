import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });

// 링크 미리보기 기본값. og를 따로 정하지 않은 페이지(랜딩, 신청, 로그인으로 넘어가는 주소)는 이 카드를 쓴다.
// og 태그가 없으면 카카오톡 같은 스크래퍼가 본문 첫 이미지(프로젝트 예시의 유튜브 화면)를 집어 간다.
// 카드 원본은 docs/education/referral/og-apply.html이고, render_og.py로 public/og/yeoul-apply.png를 다시 만든다.
const shareTitle = "여울 · CREAI+IT AI 스터디 2기 모집";
const shareDescription = "AI 시대에 필요한 기초를 4주 동안 함께 쌓습니다. 한 반 8명 이내로 꾸리니, 가능한 날짜와 시간대를 남겨 주세요.";
const shareImage = { url: "/og/yeoul-apply.png", width: 1200, height: 630, alt: "여울 CREAI+IT AI 스터디 2기 참가자 모집 안내" };

export const metadata: Metadata = {
  metadataBase: new URL("https://study.creai-it.com"),
  title: "AI 스터디",
  description: "CREAI+IT AI 스터디 운영",
  openGraph: { type: "website", siteName: "CREAI+IT EDU", locale: "ko_KR", title: shareTitle, description: shareDescription, images: [shareImage] },
  twitter: { card: "summary_large_image", title: shareTitle, description: shareDescription, images: [shareImage] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={outfit.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
