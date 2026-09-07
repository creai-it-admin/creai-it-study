// 라우팅 규칙. 위에서부터 판정한다.
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLiveState } from "@/lib/session-state";

export const dynamic = "force-dynamic";

export default async function Entry() {
  const session = await auth();
  // 1. 로그인 안 됨
  if (!session?.user) redirect("/login");
  // 동의가 아직 안 찍힌 계정은 로그인 화면으로 되돌린다.
  if (!session.user.consented) redirect("/login?consent=1");

  // 2. status=running인 회차가 있으면 현재 구간 화면으로. 3. 그 외 /home
  const state = await getLiveState();
  redirect(state.route);
}
