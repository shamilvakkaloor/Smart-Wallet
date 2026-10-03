import { Prisma } from "@prisma/client";
import type { ReportFilters } from "@/validation/reports";
export type ReportCategory = {id:string; name:string; type:string; parentId:string|null; status:string};
export type ReportCurrency = {id:string; code:string; decimalPlaces:number};
export type ReportEntry = {id:string;reference:string;transactionDate:Date;type:string;currencyId:string|null;categoryId:string|null;description:string;amount:Prisma.Decimal|number;allocations:{amount:Prisma.Decimal|number;account:{id:string;type:string;accountName:string}}[]};
export type ReportRow = {id:string;label:string;type:string;cash:number;bank:number;total:number;months:number[]};
export type ReportDetail = {id:string;reference:string;date:string;type:string;category:string;description:string;cash:number;bank:number;total:number;entryAmount:number;accounts:string};
export type CurrencyReport = {currency:ReportCurrency;rows:ReportRow[];details:ReportDetail[];income:ReportRow;expense:ReportRow};
const D=Prisma.Decimal;
type Accumulator = {cash:Prisma.Decimal;bank:Prisma.Decimal;months:Prisma.Decimal[]};
const empty=():Accumulator=>({cash:new D(0),bank:new D(0),months:Array.from({length:12},()=>new D(0))});
const amount=(a:Accumulator)=>({cash:a.cash.toNumber(),bank:a.bank.toNumber(),total:a.cash.plus(a.bank).toNumber(),months:a.months.map(m=>m.toNumber())});
export function buildReports(entries:ReportEntry[],categories:ReportCategory[],currencies:ReportCurrency[],f:ReportFilters):CurrencyReport[] {
  const byId=new Map(categories.map(c=>[c.id,c]));
  const bucket=(id:string|null)=>{
    const category=id?byId.get(id):undefined;const parent=category?.parentId?byId.get(category.parentId):undefined;
    if(!category)return {id:'uncategorized',label:'Uncategorized'};
    return f.grouping==='category'?{id:parent?.id??category.id,label:parent?.name??category.name}:{id:category.id,label:parent?`${parent.name} / ${category.name}`:`${category.name} / General (no subcategory)`};
  };
  return currencies.filter(c=>!f.currencyId||c.id===f.currencyId).map(currency=>{
    const groups=new Map<string,{id:string;label:string;type:string;value:Accumulator}>();const totals={INCOME:empty(),EXPENSE:empty()};const details:ReportDetail[]=[];
    if(f.showZero==='1')for(const c of categories){
      if(c.status!=='ACTIVE'||(f.type&&f.type!==c.type)||(f.categoryId&&c.id!==f.categoryId&&c.parentId!==f.categoryId)||(f.subcategoryId&&c.id!==(f.subcategoryId==='__parent__'?f.categoryId:f.subcategoryId)))continue;
      const b=bucket(c.id);const key=`${c.type}:${b.id}`;if(!groups.has(key))groups.set(key,{...b,type:c.type,value:empty()});
    }
    for(const entry of entries){
      if(entry.currencyId!==currency.id || (entry.type!=='INCOME'&&entry.type!=='EXPENSE'))continue;
      const lines=entry.allocations.filter(a=>(!f.accountId||a.account.id===f.accountId)&&(!f.accountType||a.account.type===f.accountType));
      if(!lines.length)continue;
      const b=bucket(entry.categoryId);const key=`${entry.type}:${b.id}`;
      if(!groups.has(key))groups.set(key,{...b,type:entry.type,value:empty()});
      const group=groups.get(key)!;const detail=empty();const month=entry.transactionDate.getUTCMonth();
      for(const line of lines){const slot=line.account.type==='CASH'?'cash':'bank';const value=new D(line.amount);for(const target of [group.value,totals[entry.type],detail]){target[slot]=target[slot].plus(value);target.months[month]=target.months[month].plus(value);}}
      const c=entry.categoryId?byId.get(entry.categoryId):undefined;const parent=c?.parentId?byId.get(c.parentId):undefined;
      details.push({id:entry.id,reference:entry.reference,date:entry.transactionDate.toISOString().slice(0,10),type:entry.type,category:[parent?.name,c?.name].filter(Boolean).join(' / ')||'Uncategorized',description:entry.description,...amount(detail),entryAmount:Number(entry.amount),accounts:[...new Set(lines.map(l=>l.account.accountName))].join(', ')});
    }
    return {currency,rows:[...groups.values()].map(g=>({id:g.id,label:g.label,type:g.type,...amount(g.value)})).sort((a,b)=>a.type.localeCompare(b.type)||a.label.localeCompare(b.label)),details,income:{id:'income',label:'Total income',type:'INCOME',...amount(totals.INCOME)},expense:{id:'expense',label:'Total expense',type:'EXPENSE',...amount(totals.EXPENSE)}};
  });
}
