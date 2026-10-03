"use client";
import Link from "next/link";
import { useState } from "react";
import type { ReportFilters as Filters } from "@/validation/reports";
import type { ReportCategory,ReportCurrency } from "@/services/report-calculation";
export function ReportFilters({filters:f,currencies,accounts,categories}:{filters:Filters;currencies:ReportCurrency[];accounts:{id:string;name:string;type:string;currencyId:string;code:string}[];categories:ReportCategory[]}) {
  const [view,setView]=useState(f.view);const [currency,setCurrency]=useState(f.currencyId);const [account,setAccount]=useState(f.accountId);const [accountType,setAccountType]=useState(f.accountType);const [type,setType]=useState(f.type);const [category,setCategory]=useState(f.categoryId);const [sub,setSub]=useState(f.subcategoryId);
  const parents=categories.filter(c=>!c.parentId&&(!type||c.type===type));const children=categories.filter(c=>c.parentId===category);
  return <form className="card mb-6" action="/reports"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2>Choose your report</h2><Link href="/reports" className="text-sm text-emerald-700">Reset filters</Link></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Field title="Report view"><select name="view" value={view} onChange={e=>setView(e.target.value as Filters['view'])}><option value="monthly">Monthly summary</option><option value="yearly">Yearly · Jan–Dec</option><option value="custom">Custom date range</option><option value="all">Complete · All time</option></select></Field>
    {(view==='monthly'||view==='yearly')&&<Field title="Year"><input name="year" type="number" min="1900" max="9998" defaultValue={f.year} required/></Field>}
    {view==='monthly'&&<Field title="Month"><select name="month" defaultValue={f.month}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{new Date(2026,i,1).toLocaleString('en',{month:'long'})}</option>)}</select></Field>}
    {view==='custom'&&<><Field title="From"><input name="from" type="date" defaultValue={f.from} required/></Field><Field title="Through (inclusive)"><input name="to" type="date" defaultValue={f.to} required/></Field></>}
    <Field title="Currency"><select name="currencyId" value={currency} onChange={e=>{setCurrency(e.target.value);setAccount('')}}><option value="">All currencies · separate totals</option>{currencies.map(c=><option key={c.id} value={c.id}>{c.code}</option>)}</select></Field>
    <Field title="Account type"><select name="accountType" value={accountType} onChange={e=>{setAccountType(e.target.value as Filters['accountType']);setAccount('')}}><option value="">Cash & Bank</option><option value="CASH">Cash only</option><option value="BANK">Bank only</option></select></Field>
    <Field title="Account"><select name="accountId" value={account} onChange={e=>setAccount(e.target.value)}><option value="">All matching accounts</option>{accounts.filter(a=>(!currency||a.currencyId===currency)&&(!accountType||a.type===accountType)).map(a=><option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}</select></Field>
    <Field title="Entry type"><select name="type" value={type} onChange={e=>{setType(e.target.value as Filters['type']);setCategory('');setSub('')}}><option value="">Income & Expense</option><option value="INCOME">Income</option><option value="EXPENSE">Expense</option></select></Field>
    <Field title="Group rows by"><select name="grouping" defaultValue={f.grouping}><option value="category">Parent category</option><option value="subcategory">Subcategory</option></select></Field>
    <Field title="Parent category"><select name="categoryId" value={category} onChange={e=>{setCategory(e.target.value);setSub('')}}><option value="">All categories</option>{parents.map(c=><option key={c.id} value={c.id}>{c.name} · {c.type.toLowerCase()}{c.status!=='ACTIVE'?' (archived)':''}</option>)}</select></Field>
    <Field title="Subcategory"><select name="subcategoryId" value={sub} onChange={e=>setSub(e.target.value)} disabled={!category}><option value="">Parent + all subcategories</option><option value="__parent__">Parent only (no subcategory)</option>{children.map(c=><option key={c.id} value={c.id}>{c.name}{c.status!=='ACTIVE'?' (archived)':''}</option>)}</select></Field>
    <Field title="Minimum entry amount"><input name="min" type="number" min="0" step="0.0001" defaultValue={f.min}/></Field><Field title="Maximum entry amount"><input name="max" type="number" min="0" step="0.0001" defaultValue={f.max}/></Field>
    <label className="sm:col-span-2">Search<input name="q" maxLength={200} defaultValue={f.q} placeholder="Description, notes or reference"/></label>
    <label className="flex items-center gap-2 self-end py-3"><input name="showZero" type="checkbox" value="1" defaultChecked={f.showZero==='1'}/>Include zero categories</label><div className="flex items-end"><button className="btn-primary w-full">Apply filters</button></div>
  </div></form>;
}
function Field({title,children}:{title:string;children:React.ReactNode}){return <label className="mb-0">{title}<span className="mt-2 block">{children}</span></label>}
