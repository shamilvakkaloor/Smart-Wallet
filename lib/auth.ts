import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { createLoginVerifier } from "@/lib/password-login";

const verifyLogin = createLoginVerifier();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Credentials({
    credentials: {
      username: { label: "User ID", type: "text" },
      password: { label: "Password", type: "password" },
    },
    authorize: verifyLogin,
  })],
});
