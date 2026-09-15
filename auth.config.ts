import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  providers: [Google],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    signIn({ profile }) {
      const allowed = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
      return Boolean(allowed && profile?.email?.toLowerCase() === allowed);
    },
    authorized({ auth, request }) {
      const publicPath = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/api/auth");
      return publicPath || Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
