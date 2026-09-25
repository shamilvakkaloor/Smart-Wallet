import type { Metadata, Viewport } from "next";
import { auth } from "@/lib/auth";
import { PwaInstall } from "@/components/pwa-install";
import { Nav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Wallet",
  description: "Personal multi-currency finance manager",
  applicationName: "Smart Wallet",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/wallet-192.png", apple: "/icons/wallet-180.png" },
  appleWebApp: { capable: true, title: "Smart Wallet", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#059669" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider>{session?.user && <Nav />}<main className={session?.user ? "mx-auto min-h-screen max-w-7xl px-4 py-6 pb-24 lg:ml-64 lg:px-8 lg:pb-8" : "min-h-screen"}><PwaInstall />{children}</main></ThemeProvider></body></html>;
}
