import Link from "next/link";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { DashboardChart } from "@/components/dashboard-chart";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getFinancialPosition } from "@/services/balance-service";

export default async function HomePage() {
  const now = new Date(); const start = startOfMonth(now); const end = endOfMonth(now);
  const [position, transactions, recent, issues] = await Promise.all([
    getFinancialPosition(),
    db.transaction.findMany({ where: { status: "ACTIVE", transactionDate: { gte: start, lte: end }, type: { in: ["INCOME", "EXPENSE"] } }, include: { allocations: { include: { account: { include: { currency: true } } } } } }),
    db.transaction.findMany({ where: { status: "ACTIVE" }, orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }], take: 8, include: { allocations: { include: { account: { include: { currency: true } } } } } }),
    db.transactionAllocation.count({ where: { transaction: { status: "ACTIVE" } } }),
  ]);
  const chart = position.map((currency) => ({ label: currency.code, income: transactions.filter((t) => t.type === "INCOME" && t.currencyId === currency.id).reduce((s, t) => s + Number(t.amount), 0), expense: transactions.filter((t) => t.type === "EXPENSE" && t.currencyId === currency.id).reduce((s, t) => s + Number(t.amount), 0) }));
  return <>
    <PageHeader title="Financial overview" description={`${format(start, "MMMM yyyy")} · Your money at a glance`} actions={<><Link className="btn-primary" href="/entries/new?type=INCOME">+ Income</Link><Link className="btn-secondary" href="/entries/new?type=EXPENSE">+ Expense</Link></>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{position.flatMap((c) => [<div className="card" key={`${c.id}-balance`}><p className="text-sm text-slate-500">{c.code} Balance</p><p className="mt-2 text-2xl font-bold">{money(c.balance, c.code, c.decimals)}</p><p className="mt-2 text-xs text-slate-400">Money you own</p></div>, <div className="card" key={`${c.id}-available`}><p className="text-sm text-slate-500">{c.code} Actual Balance</p><p className="mt-2 text-2xl font-bold">{money(c.available, c.code, c.decimals)}</p><p className="mt-2 text-xs text-slate-400">Currently available</p></div>])}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-3"><section className="card xl:col-span-2"><h2 className="mb-4 font-semibold">Income vs Expense</h2><DashboardChart data={chart}/></section><section className="card"><h2 className="font-semibold">Debt position</h2><div className="mt-5 space-y-5">{position.map((c) => <div key={c.id}><div className="flex justify-between text-sm"><span>{c.code} receivable</span><strong>{money(c.receivable, c.code, c.decimals)}</strong></div><div className="mt-2 flex justify-between text-sm"><span>{c.code} payable</span><strong>{money(c.payable, c.code, c.decimals)}</strong></div></div>)}</div><Link href="/debt" className="mt-6 inline-block text-sm font-semibold text-emerald-600">Open Debt & Credit →</Link></section></div>
    <section className="card mt-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent transactions</h2><Link href="/entries" className="text-sm text-emerald-600">View all</Link></div><div className="divide-y divide-slate-100 dark:divide-slate-800">{recent.map((t) => { const code = t.allocations[0]?.account.currency.code ?? position.find((p) => p.id === t.currencyId)?.code ?? ""; return <Link href={`/entries/${t.id}`} key={t.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium">{t.description}</p><p className="text-xs text-slate-500">{t.reference} · {t.transactionDate.toLocaleDateString("en-GB")}</p></div><p className={`font-semibold ${t.type === "INCOME" ? "text-emerald-600" : t.type === "EXPENSE" ? "text-rose-600" : ""}`}>{t.type === "EXPENSE" ? "−" : t.type === "INCOME" ? "+" : ""}{money(Number(t.amount), code || "OMR")}</p></Link>; })}{!recent.length && <p className="py-8 text-center text-sm text-slate-500">No transactions yet. Add your first entry.</p>}</div></section>
    {issues === 0 && <p className="mt-4 text-center text-xs text-slate-400">Financial data is ready for health checks.</p>}
  </>;
}
