// 동의 체크를 구글 왕복 동안 유지한다. 로그인 화면에서 버튼을 누르기 직전에 호출한다.
import { NextResponse } from "next/server";
import { CONSENT_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CONSENT_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
  return res;
}
