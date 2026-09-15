import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = { title: "Smart Wallet", description: "Personal multi-currency finance manager" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider>{session?.user && <Nav />}<main className={session?.user ? "mx-auto min-h-screen max-w-7xl px-4 py-6 pb-24 lg:ml-64 lg:px-8 lg:pb-8" : "min-h-screen"}>{children}</main></ThemeProvider></body></html>;
}
