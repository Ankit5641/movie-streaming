import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      avatar?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    avatar?: string | null;
  }
}
