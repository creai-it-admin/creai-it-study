// 동의 게이트와 운영진 차단을 한 곳에서 건다.
// 화면마다 검사를 흩어 놓으면 하나 빠뜨렸을 때 그 문으로 다 들어온다.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC = ["/login", "/api/auth", "/api/consent"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isApi = pathname.startsWith("/api");

  // 로그인 안 됨
  if (!token) {
    if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 동의 안 함. 화면이든 API든 여기서 다 막는다.
  if (!token.consented) {
    if (isApi) return NextResponse.json({ error: "consent required" }, { status: 403 });
    return NextResponse.redirect(new URL("/login?consent=1", req.url));
  }

  // 운영진 아님
  const roles = (token.roles as string[] | undefined) ?? [];
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!roles.includes("admin")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|pdf.worker.min.mjs).*)"],
};
