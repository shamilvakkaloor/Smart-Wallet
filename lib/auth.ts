import NextAuth from "next-auth";
import { walletAuthAdapter } from "@/lib/auth-adapter";
import { db } from "@/lib/db";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: walletAuthAdapter(db),
  session: { strategy: "jwt" },
});
