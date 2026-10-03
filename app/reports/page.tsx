import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ReportFilters } from "@/components/report-filters";
import { DashboardChart } from "@/components/dashboard-chart";
import { parseReportFilters,reportQuery,type ReportFilters as Filters } from "@/validation/reports";
import { loadReportOptions,loadReports } from "@/services/report-service";
import type { CurrencyReport,ReportRow } from "@/services/report-calculation";
import { apiError } from "@/lib/api-error";
import { money } from "@/lib/format";
const monthNames=Array.from({length:12},(_,i)=>new Date(2026,i,1).toLocaleString('en',{month:'short'}));
export default async function ReportsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params=await searchParams;const options=await loadReportOptions();let f:Filters;let reports:CurrencyReport[]=[];let error='';
  try { f=parseReportFilters(params);reports=await loadReports(f,options); } catch(e) { error=apiError(e);f=parseReportFilters({}); }
  const title=f.view==='all'?'Complete summary · All time':f.view==='yearly'?`Yearly summary · ${f.year}`:f.view==='custom'?`${f.from} through ${f.to}`:`${new Date(f.year,f.month-1,1).toLocaleString('en',{month:'long'})} ${f.year}`;
  return <><PageHeader title="Summary & Reports" description="Monthly, yearly and complete summaries, down to each category and account." actions={!error&&<><a className="btn-secondary" href={`/api/reports/export?${reportQuery(f,{format:'summary'})}`}><Download size={16}/>Summary CSV</a><a className="btn-secondary" href={`/api/reports/export?${reportQuery(f,{format:'entries'})}`}><Download size={16}/>Entries CSV</a></>}/>
    {error&&<p role="alert" className="mb-5 rounded-xl bg-rose-50 p-4 text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error} <Link className="underline" href="/reports">Reset filters</Link></p>}
    <ReportFilters key={JSON.stringify(params)} filters={f} {...options}/>
    {!error&&<><h2 className="mb-2 text-xl font-semibold">{title}</h2><p className="mb-6 max-w-4xl text-sm leading-relaxed text-muted">Income and expenses only. Transfers, currency exchanges, debt activity and account opening balances are excluded. Net is income minus expenses, not your wallet balance. Account filters count only the selected allocation of split entries; amount limits apply to the whole entry.</p>
      {reports.map(report=><section key={report.currency.id} className="mb-8 space-y-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{report.currency.code} summary</h2><span className="text-sm text-muted">{report.details.length} matching entries</span></div>
        <div className="grid gap-3 sm:grid-cols-3">{[['Income',report.income.total],['Expense',report.expense.total],['Net',report.income.total-report.expense.total]].map(([label,value])=><div key={label} className="card"><p className="text-sm text-muted">{label}</p><p className={`mt-2 text-2xl font-semibold ${label==='Income'?'text-emerald-700':label==='Expense'?'text-rose-600':''}`}>{money(Number(value),report.currency.code,report.currency.decimalPlaces)}</p></div>)}</div>
        {!report.details.length&&<p className="rounded-xl border border-slate-200 p-4 text-sm text-muted dark:border-slate-800">No entries match these filters for {report.currency.code}.</p>}
        <p className="text-xs text-muted sm:hidden">Swipe the tables sideways to see all columns.</p>
        {(['INCOME','EXPENSE'] as const).filter(type=>!f.type||f.type===type).map(type=><SummaryTable key={type} report={report} type={type} annual={f.view==='yearly'}/>)}
        <details className="card"><summary className="font-semibold">Income vs Expense chart</summary><div className="mt-5 max-w-xl"><DashboardChart code={report.currency.code} income={report.income.total} expense={report.expense.total}/></div></details>
        <details className="card"><summary className="font-semibold">Matching entries · {report.details.length}</summary><p className="my-3 text-xs text-muted">Showing up to 50 per page. CSV includes all matching entries.</p><div className="table-wrap"><table><thead><tr><th>Date / Reference</th><th>Description / Category</th><th>Accounts</th><th>Type</th><th className="text-right">Cash</th><th className="text-right">Bank</th><th className="text-right">Included amount</th></tr></thead><tbody>{report.details.slice((f.page-1)*50,f.page*50).map(row=><tr key={row.id}><td className="whitespace-nowrap">{row.date}<br/><Link href={`/entries/${row.id}`} className="text-xs text-emerald-700">{row.reference}</Link></td><td>{row.description}<p className="mt-1 text-xs text-muted">{row.category}</p></td><td>{row.accounts}</td><td>{row.type}</td>{[row.cash,row.bank,row.total].map((v,i)=><td className="whitespace-nowrap text-right" key={i}>{money(v,report.currency.code,report.currency.decimalPlaces)}</td>)}</tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap gap-3">{f.page>1&&<Link className="btn-secondary" href={`/reports?${reportQuery(f,{page:f.page-1})}`}>Previous entries</Link>}<span className="self-center text-sm">Page {f.page}</span>{report.details.length>f.page*50&&<Link className="btn-secondary" href={`/reports?${reportQuery(f,{page:f.page+1})}`}>Next entries</Link>}</div></details>
      </section>)}
    </>}
  </>;
}
function SummaryTable({report,type,annual}:{report:CurrencyReport;type:'INCOME'|'EXPENSE';annual:boolean}) {
  const rows=report.rows.filter(r=>r.type===type);const total=type==='INCOME'?report.income:report.expense;
  const format=(n:number)=>new Intl.NumberFormat(report.currency.code==='INR'?'en-IN':'en-GB',{minimumFractionDigits:report.currency.decimalPlaces,maximumFractionDigits:report.currency.decimalPlaces}).format(n);
  const cells=(r:ReportRow)=>(annual?[...r.months,r.total]:[r.cash,r.bank,r.total]).map((n,i)=><td key={i} className="whitespace-nowrap text-right tabular-nums">{format(n)}</td>);
  return <div className="table-wrap"><div className={`px-5 py-4 text-sm font-semibold ${type==='INCOME'?'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200':'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200'}`}>{type==='INCOME'?'↙ Income':'↗ Expenses'} · {report.currency.code}</div><table><caption className="sr-only">{type} category summary in {report.currency.code}</caption><thead><tr><th className="sticky left-0 z-10 min-w-48">Category / Subcategory</th>{(annual?[...monthNames,'Total']:['Cash','Bank','Total']).map(h=><th key={h} className="min-w-28 text-right">{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td className="sticky left-0 bg-white font-medium dark:bg-slate-900">{r.label}</td>{cells(r)}</tr>)}{!rows.length&&<tr><td colSpan={annual?14:4} className="text-center text-muted">No matching categories.</td></tr>}</tbody><tfoot><tr className="bg-slate-50 font-bold dark:bg-slate-950"><td className="sticky left-0 bg-slate-50 dark:bg-slate-950">{total.label}</td>{cells(total)}</tr></tfoot></table></div>;
}
