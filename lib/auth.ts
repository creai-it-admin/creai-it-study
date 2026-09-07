// FR-102, FR-103. 구글로 로그인하면 계정을 만들고 participant를 붙인다.
// ADMIN_EMAILS에 있으면 admin도 같이 붙는다.
// 동의는 로그인 화면에서 받고, 구글 왕복을 견디게 쿠키에 실어 보낸 뒤 여기서 consentedAt에 찍는다.
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const CONSENT_COOKIE = "creai_consent";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();

      let consented = false;
      try {
        const jar = await cookies();
        consented = jar.get(CONSENT_COOKIE)?.value === "1";
      } catch {
        consented = false;
      }

      const roles: ("participant" | "admin")[] = ["participant"];
      if (adminEmails().includes(email)) roles.push("admin");

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            roles,
            consentedAt: existing.consentedAt ?? (consented ? new Date() : null),
          },
        });
      }
      // 계정이 아직 없으면 어댑터가 만든 뒤 events.createUser에서 채운다.
      return true;
    },
    async jwt({ token }) {
      if (!token.email) return token;
      const u = await prisma.user.findUnique({
        where: { email: token.email.toLowerCase() },
        select: { id: true, roles: true, consentedAt: true, name: true },
      });
      if (u) {
        token.uid = u.id;
        token.roles = u.roles;
        token.consented = !!u.consentedAt;
        token.name = u.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.roles = (token.roles as ("participant" | "admin")[]) ?? [];
        session.user.consented = !!token.consented;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;
      const email = user.email.toLowerCase();
      let consented = false;
      try {
        const jar = await cookies();
        consented = jar.get(CONSENT_COOKIE)?.value === "1";
      } catch {
        consented = false;
      }
      const roles: ("participant" | "admin")[] = ["participant"];
      if (adminEmails().includes(email)) roles.push("admin");
      await prisma.user.update({
        where: { id: user.id! },
        data: { roles, consentedAt: consented ? new Date() : null },
      });
    },
  },
});

export async function requireUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || !user.roles?.includes("admin")) return null;
  return user;
}
