import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: ("participant" | "admin")[];
      consented: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    authMethod?: "password";
    authVersion?: number;
    roles?: ("participant" | "admin")[];
    consented?: boolean;
  }
}
