import type { Metadata, Viewport } from "next";
import { auth } from "@/lib/auth";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Wallet",
  description: "Personal multi-currency finance manager",
  applicationName: "Smart Wallet",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icons/wallet.svg", type: "image/svg+xml" }], apple: "/icons/wallet-180.png" },
  appleWebApp: { capable: true, title: "Smart Wallet", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f8f7" }, { media: "(prefers-color-scheme: dark)", color: "#0b1412" }], viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider><ServiceWorkerRegistration />{session?.user ? <AppShell username={process.env.LOGIN_USER ?? "My wallet"}>{children}</AppShell> : <main>{children}</main>}</ThemeProvider></body></html>;
}
