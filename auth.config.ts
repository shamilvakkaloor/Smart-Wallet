import type { NextAuthConfig } from "next-auth";
import { loginVersion } from "./lib/password-login";

export default {
  providers: [],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      const version = await loginVersion();
      if (!version) return null;
      if (user) token.loginVersion = version;
      if (token.loginVersion !== version) return null;
      return token;
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const publicPath = path === "/login" || path === "/api/auth" || path.startsWith("/api/auth/");
      return publicPath || Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
