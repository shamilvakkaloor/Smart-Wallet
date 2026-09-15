"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { logout } from "@/app/actions";

const links = [["/", "Home"], ["/entries", "Entries"], ["/wallets", "Wallets & Banks"], ["/debt", "Debt & Credit"], ["/budgets", "Budgets"], ["/reports", "Reports"], ["/data-health", "Data Health"], ["/settings", "Settings"]];

export function Nav() {
  const path = usePathname(); const { theme, setTheme } = useTheme();
  return <>
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 lg:block">
      <Link href="/" className="mb-8 flex items-center gap-3 text-xl font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white">SW</span>Smart Wallet</Link>
      <nav className="space-y-1">{links.map(([href, label]) => <Link key={href} href={href} className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${path === href || (href !== "/" && path.startsWith(href)) ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"}`}>{label}</Link>)}</nav>
      <div className="absolute bottom-5 left-5 right-5 space-y-2"><select aria-label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)}><option value="system">System theme</option><option value="light">Light theme</option><option value="dark">Dark theme</option></select><form action={logout}><button className="btn-secondary w-full">Sign out</button></form></div>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white px-1 py-2 dark:border-slate-800 dark:bg-slate-950 lg:hidden">{links.slice(0, 5).map(([href, label]) => <Link key={href} href={href} className={`px-2 py-1 text-center text-[11px] ${path === href ? "font-bold text-emerald-600" : "text-slate-500"}`}>{label.replace(" & ", " &\n")}</Link>)}</nav>
  </>;
}
