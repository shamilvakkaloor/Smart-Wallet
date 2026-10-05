"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { House, ArrowLeftRight, Wallet, HandCoins, ChartPie, ChartNoAxesCombined, ShieldCheck, Settings2, Plus, Ellipsis, X, LogOut, Sun, Moon, Monitor, PanelLeftClose, PanelLeftOpen, ArrowDownLeft, ArrowUpRight, Repeat2, ChevronRight, DatabaseBackup } from "lucide-react";
import { logout } from "@/app/actions";
import { Brand } from "@/components/brand";
const links = [
  { href: "/", label: "Home", icon: House }, { href: "/entries", label: "Entries", icon: ArrowLeftRight },
  { href: "/wallets", label: "Wallets & Banks", icon: Wallet }, { href: "/debt", label: "Debt & Credit", icon: HandCoins },
  { href: "/budgets", label: "Budgets", icon: ChartPie }, { href: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  { href: "/data-health", label: "Data Health", icon: ShieldCheck }, { href: "/settings", label: "Settings", icon: Settings2 },
];
function ThemeToggle() {
  const { theme, setTheme } = useTheme(); const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <div className="segmented flex" aria-label="Color theme">{[{ value: "system", icon: Monitor }, { value: "light", icon: Sun }, { value: "dark", icon: Moon }].map(({ value, icon: Icon }) => <button key={value} type="button" className="flex flex-1 items-center justify-center gap-1.5 !px-2 !min-h-11" aria-label={`${value} theme`} aria-pressed={mounted && theme === value} onClick={() => setTheme(value)}><Icon size={15}/><span className="capitalize">{value}</span></button>)}</div>;
}
export function Nav({ username = "My wallet", collapsed = false, onCollapse }: { username?: string; collapsed?: boolean; onCollapse?: () => void }) {
  const path = usePathname(); const [sheet, setSheet] = useState<"more" | "quick" | null>(null); const dialog = useRef<HTMLDialogElement>(null);
  const active = (href: string) => path === href || (href !== "/" && path.startsWith(href));
  useEffect(() => { setSheet(null); }, [path]);
  useEffect(() => { const el = dialog.current; if (!el) return; if (sheet) { el.showModal(); const overflow = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = overflow; el.close(); }; } el.close(); }, [sheet]);
  return <>
    <aside className="desktop-sidebar" aria-label="Sidebar">
      <Link href="/" aria-label="Smart Wallet home" className="sidebar-brand px-2"><Brand compact={collapsed}/></Link>
      <p className="sidebar-expanded mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-muted">Your workspace</p>
      <nav className="sidebar-navigation space-y-1" aria-label="Main navigation">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} title={collapsed ? label : undefined} aria-label={label} aria-current={active(href) ? "page" : undefined} className="nav-link"><Icon size={19} strokeWidth={1.7}/><span className="nav-label">{label}</span></Link>)}</nav>
      <div className="sidebar-footer"><button type="button" className="nav-link w-full" onClick={onCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={19}/> : <PanelLeftClose size={19}/>}<span className="nav-label text-xs">Collapse sidebar</span></button><div className="sidebar-expanded"><ThemeToggle/><div className="sidebar-profile flex items-center gap-3 border-t border-slate-200 dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-950">{username.slice(0,2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{username}</p><p className="text-xs text-muted">Personal workspace</p></div><form action={logout}><button className="grid h-11 w-11 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Sign out" title="Sign out"><LogOut size={18}/></button></form></div></div></div>
    </aside>
    <header className="mobile-topbar"><Link href="/" aria-label="Smart Wallet home"><Brand/></Link><button type="button" aria-label="Open all sections and settings" className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950" onClick={() => setSheet("more")}>{username.slice(0,2).toUpperCase()}</button></header>
    <nav className="mobile-tabs" aria-label="Mobile navigation">
      {links.slice(0,2).map(({ href, label, icon: Icon }) => <Link className="mobile-tab" key={href} href={href} aria-current={active(href) ? "page" : undefined}><Icon size={21}/>{label}</Link>)}
      <button type="button" className="mobile-tab" aria-label="Add entry" onClick={() => setSheet("quick")}><span className="mobile-add"><Plus size={25}/></span><span>Add</span></button>
      <Link href="/wallets" className="mobile-tab" aria-current={active("/wallets") ? "page" : undefined}><Wallet size={21}/>Wallets</Link>
      <button type="button" className="mobile-tab" onClick={() => setSheet("more")} aria-expanded={sheet === "more"}><Ellipsis size={23}/>More</button>
    </nav>
    <dialog ref={dialog} className="sheet" aria-labelledby="sheet-title" onCancel={() => setSheet(null)} onClose={() => setSheet(null)} onClick={e => { if (e.target === e.currentTarget) setSheet(null); }}><div className="sheet-content"><div className="mb-5 flex items-center justify-between"><div><p className="mb-1 text-xs font-medium text-muted">SMART WALLET</p><h2 id="sheet-title" className="text-2xl font-bold tracking-tight">{sheet === "quick" ? "Add an entry" : "Your workspace"}</h2></div><button type="button" onClick={() => setSheet(null)} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 dark:border-slate-800" aria-label="Close menu"><X size={20}/></button></div>
      {sheet === "quick" ? <div className="space-y-2">{[{ type: "INCOME", label: "Add income", icon: ArrowDownLeft }, { type: "EXPENSE", label: "Add expense", icon: ArrowUpRight }, { type: "TRANSFER", label: "Transfer between accounts", icon: ArrowLeftRight }, { type: "EXCHANGE", label: "Exchange currencies", icon: Repeat2 }].map(({ type, label, icon: Icon }) => <Link href={`/entries/new?type=${type}`} key={type} className="nav-link" onClick={() => setSheet(null)}><Icon size={20}/>{label}<ChevronRight className="ml-auto" size={17}/></Link>)}</div> : <><nav aria-label="All sections" className="space-y-1">{[...links, { href: "/backup", label: "Backup & Restore", icon: DatabaseBackup }].map(({ href, label, icon: Icon }) => <Link href={href} key={href} aria-current={active(href) ? "page" : undefined} className="nav-link" onClick={() => setSheet(null)}><Icon size={19}/>{label}<ChevronRight className="ml-auto" size={16}/></Link>)}</nav><div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800"><p className="mb-3 text-sm font-medium">Appearance</p><ThemeToggle/><form action={logout} className="mt-4"><button className="btn-secondary w-full"><LogOut size={17}/>Sign out</button></form></div></>}
    </div></dialog>
  </>;
}
