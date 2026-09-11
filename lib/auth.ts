import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { authenticate } from './password-auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Credentials({
    credentials: { email: {type:'email'}, password: {type:'password'}, agreed: {} },
    authorize: authenticate,
  })],
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {strategy:'jwt'},
  pages: {signIn:'/routes/login'},
  callbacks: {
    async jwt({token,user}) {
      if (user) {
        token.uid = user.id;
        token.authVersion = (user as typeof user & {authVersion:number}).authVersion;
        token.authMethod = 'password';
      }
      // Old Google sessions cannot survive the cutover. Password resets revoke sessions.
      if (!token.uid || token.authMethod !== 'password') return null;
      const current = await prisma.user.findUnique({
        where:{id:token.uid},
        select:{id:true,email:true,name:true,roles:true,consentedAt:true,authVersion:true,passwordHash:true},
      });
      if (!current?.passwordHash || current.authVersion !== token.authVersion) return null;
      token.roles = current.roles;
      token.consented = !!current.consentedAt;
      token.email = current.email;
      token.name = current.name;
      return token;
    },
    async session({session,token}) {
      if (session.user) {
        session.user.id = token.uid ?? '';
        session.user.roles = token.roles ?? [];
        session.user.consented = !!token.consented;
      }
      return session;
    },
  },
});

export async function requireUser() {
  const session = await auth();
  return session?.user?.consented ? session.user : null;
}
export async function requireAdmin() {
  const user = await requireUser();
  return user?.roles.includes('admin') ? user : null;
}
