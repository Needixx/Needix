// types/next-auth.d.ts
import type { DefaultSession } from "next-auth";
import type { JWT as BaseJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends BaseJWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
