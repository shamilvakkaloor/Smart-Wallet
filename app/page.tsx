import Link from "next/link";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ArrowRight, CalendarDays, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DashboardOverview } from "@/components/dashboard-overview";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getFinancialPosition } from "@/services/balance-service";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const selectedMonth = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && Number(month.slice(0,4)) >= 1900 ? month : format(new Date(), "yyyy-MM");
  const start = new Date(`${selectedMonth}-01T00:00:00.000Z`); const end = new Date(start); end.setUTCMonth(end.getUTCMonth()+1);
  const [position, transactions, recent] = await Promise.all([
    getFinancialPosition(),
    db.transaction.findMany({ where: { status: "ACTIVE", transactionDate: { gte: start, lt: end }, type: { in: ["INCOME", "EXPENSE"] } } }),
    db.transaction.findMany({ where: { status: "ACTIVE" }, orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }], take: 8, include: { category: true } }),
  ]);
  const chart = position.map(currency => ({ label: currency.code, income: transactions.filter(t => t.type === "INCOME" && t.currencyId === currency.id).reduce((s,t) => s + Number(t.amount),0), expense: transactions.filter(t => t.type === "EXPENSE" && t.currencyId === currency.id).reduce((s,t) => s + Number(t.amount),0) }));
  return <>
    <PageHeader title="Financial overview" description="A little clarity for every currency." actions={<><Link className="btn-primary" href="/entries/new?type=INCOME"><ArrowDownLeft size={17}/>Income</Link><Link className="btn-expense" href="/entries/new?type=EXPENSE"><ArrowUpRight size={17}/>Expense</Link></>}/>
    <form className="mb-6 flex flex-wrap items-center gap-2" aria-label="Activity month"><CalendarDays size={16} className="text-muted"/><label className="sr-only" htmlFor="overview-month">Activity month</label><input className="!w-auto !min-h-10 !py-2 !text-xs" id="overview-month" type="month" name="month" defaultValue={selectedMonth} required/><button className="btn-secondary !min-h-10 !text-xs">View month</button></form>
    <DashboardOverview position={position} activity={chart} monthLabel={format(start, "MMMM yyyy")}/>
    <section className="card mt-6"><div className="mb-3 flex items-center justify-between gap-3"><div><h2>Recent entries</h2><p className="mt-1 text-xs text-muted">Your latest activity across all accounts</p></div><Link href="/entries" className="flex min-h-11 items-center gap-2 text-xs font-semibold text-emerald-700">View all<ArrowRight size={15}/></Link></div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">{recent.map(t => { const c = position.find(p => p.id === t.currencyId); const Icon = t.type === "INCOME" ? ArrowDownLeft : t.type === "EXPENSE" ? ArrowUpRight : ArrowLeftRight; return <Link href={`/entries/${t.id}`} key={t.id} className="flex items-center gap-3 py-4"><span className={`icon-tile ${t.type === "INCOME" ? "text-emerald-700" : t.type === "EXPENSE" ? "text-rose-600" : "text-muted"}`}><Icon size={18}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t.description}</p><p className="mt-1 truncate text-xs text-muted">{t.category?.name ?? t.type.toLowerCase()} · {t.transactionDate.toLocaleDateString("en-GB",{ day: "numeric", month: "short" })}</p></div><p className={`shrink-0 text-right text-sm font-semibold ${t.type === "INCOME" ? "text-emerald-700" : t.type === "EXPENSE" ? "text-rose-600" : ""}`}>{t.type === "EXPENSE" ? "−" : t.type === "INCOME" ? "+" : ""}{money(Number(t.amount), c?.code ?? "OMR", c?.decimals)}</p></Link>; })}</div>
      {!recent.length && <div className="py-10 text-center"><ReceiptText className="mx-auto mb-3 text-emerald-700" size={30}/><p className="font-medium">Your story starts with one entry</p><p className="mt-2 text-sm text-muted">Record your income or spending to see it here.</p><Link className="btn-primary mt-5" href="/entries/new">Add your first entry</Link></div>}
    </section>
  </>;
}
