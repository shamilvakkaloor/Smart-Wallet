"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";
export function DashboardChart({ income, expense, code }: { income: number; expense: number; code: string }) {
  if(income===0&&expense===0)return <p className="flex min-h-32 items-center justify-center rounded-xl bg-emerald-50/50 p-5 text-center text-sm text-muted dark:bg-emerald-950/20">No income or expenses for this period.</p>;
  return <div className="h-52 w-full" role="img" aria-label={`${code}: income ${money(income, code)}, expense ${money(expense, code)}`}>
    <ResponsiveContainer width="100%" height="100%"><BarChart data={[{ label: "Income", income }, { label: "Expense", expense }]} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barSize={46}>
      <CartesianGrid stroke="var(--line)" vertical={false} strokeDasharray="4 4"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} dy={8}/><YAxis width={52} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} tickFormatter={v => new Intl.NumberFormat("en", { notation: "compact" }).format(v)}/>
      <Tooltip cursor={{ fill: "var(--canvas)" }} contentStyle={{ borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink)", fontSize: 12 }} formatter={value => money(Number(value), code)}/><Bar dataKey="income" name="Income" fill="#059669" radius={[7,7,0,0]} isAnimationActive={false}/><Bar dataKey="expense" name="Expense" fill="#e75470" radius={[7,7,0,0]} isAnimationActive={false}/>
    </BarChart></ResponsiveContainer>
  </div>;
}
