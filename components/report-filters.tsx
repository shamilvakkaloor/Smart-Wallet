"use client";
import { MultiSelect } from "@/components/multi-select";
import { matchesSelection, selections } from "@/validation/reports";
import { useState } from "react";
import type { ReportFilters as Filters } from "@/validation/reports";
import type { ReportCategory,ReportCurrency } from "@/services/report-calculation";
export function ReportFilters({filters:f,currencies,accounts,categories}:{filters:Filters;currencies:ReportCurrency[];accounts:{id:string;name:string;type:string;currencyId:string;code:string}[];categories:ReportCategory[]}) {
  const [view,setView]=useState(f.view);const [currency,setCurrency]=useState(f.currencyId);const [account,setAccount]=useState(f.accountId);const [accountType,setAccountType]=useState(f.accountType);const [type,setType]=useState(f.type);const [category,setCategory]=useState(f.categoryId);const [sub,setSub]=useState(f.subcategoryId);
  const parents=categories.filter(c=>!c.parentId&&matchesSelection(type,c.type));const children=categories.filter(c=>selections(category).includes(c.parentId??""));
  return <form className="card mb-6" action="/reports"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2>Choose your report</h2><a href="/reports" className="text-sm text-emerald-700">Reset filters</a></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Field title="Report view"><select name="view" value={view} onChange={e=>setView(e.target.value as Filters['view'])}><option value="monthly">Monthly summary</option><option value="yearly">Yearly · Jan–Dec</option><option value="custom">Custom date range</option><option value="all">Complete · All time</option></select></Field>
    {(view==='monthly'||view==='yearly')&&<Field title="Year"><input name="year" type="number" min="1900" max="9998" defaultValue={f.year} required/></Field>}
    {view==='monthly'&&<Field title="Month"><select name="month" defaultValue={f.month}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{new Date(2026,i,1).toLocaleString('en',{month:'long'})}</option>)}</select></Field>}
    {view==='custom'&&<><Field title="From"><input name="from" type="date" defaultValue={f.from} required/></Field><Field title="Through (inclusive)"><input name="to" type="date" defaultValue={f.to} required/></Field></>}
    <MultiSelect label="Currency" name="currencyId" value={currency} onChange={v=>{setCurrency(v);setAccount('')}} emptyLabel="All currencies" options={currencies.map(c=>({value:c.id,label:c.code}))}/>
    <MultiSelect label="Account type" name="accountType" value={accountType} onChange={v=>{setAccountType(v);setAccount('')}} options={[{value:'CASH',label:'Cash'},{value:'BANK',label:'Bank'}]}/>
    <MultiSelect label="Account" name="accountId" value={account} onChange={setAccount} options={accounts.filter(a=>matchesSelection(currency,a.currencyId)&&matchesSelection(accountType,a.type)).map(a=>({value:a.id,label:`${a.name} (${a.code})`}))}/>
    <MultiSelect label="Entry type" name="type" value={type} onChange={v=>{setType(v);setCategory('');setSub('')}} options={[{value:'INCOME',label:'Income'},{value:'EXPENSE',label:'Expense'}]}/>
    <Field title="Group rows by"><select name="grouping" defaultValue={f.grouping}><option value="category">Parent category</option><option value="subcategory">Subcategory</option></select></Field>
    <MultiSelect label="Parent category" name="categoryId" value={category} onChange={v=>{setCategory(v);setSub('')}} options={parents.map(c=>({value:c.id,label:`${c.name} · ${c.type.toLowerCase()}${c.status!=='ACTIVE'?' (archived)':''}`}))}/>
    <MultiSelect label="Subcategory" name="subcategoryId" value={sub} onChange={setSub} disabled={!category} emptyLabel="Parents + subcategories" options={[{value:'__parent__',label:'Direct parent entries'},...children.map(c=>({value:c.id,label:`${parents.find(p=>p.id===c.parentId)?.name} / ${c.name}${c.status!=='ACTIVE'?' (archived)':''}`}))]}/>
    <Field title="Minimum entry amount"><input name="min" type="number" min="0" step="0.0001" defaultValue={f.min}/></Field><Field title="Maximum entry amount"><input name="max" type="number" min="0" step="0.0001" defaultValue={f.max}/></Field>
    <label className="sm:col-span-2">Search<input name="q" maxLength={200} defaultValue={f.q} placeholder="Description, notes or reference"/></label>
    <label className="flex items-center gap-2 self-end py-3"><input name="showZero" type="checkbox" value="1" defaultChecked={f.showZero==='1'}/>Include zero categories</label><div className="flex items-end"><button className="btn-primary w-full">Apply filters</button></div>
  </div></form>;
}
function Field({title,children}:{title:string;children:React.ReactNode}){return <label className="mb-0">{title}<span className="mt-2 block">{children}</span></label>}
