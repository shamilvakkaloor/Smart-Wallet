import { Prisma, AccountType, TransactionType } from "@prisma/client";
import { db } from "@/lib/db";
import { buildReports } from "@/services/report-calculation";
import { reportRange, selections, matchesSelection, type ReportFilters } from "@/validation/reports";
export async function loadReportOptions() {
  const [currencies,accounts,categories]=await Promise.all([
    db.currency.findMany({orderBy:{code:'asc'}}),db.account.findMany({include:{currency:true},orderBy:{accountName:'asc'}}),db.category.findMany({orderBy:[{type:'asc'},{name:'asc'}]}),
  ]);
  return {currencies:currencies.map(c=>({id:c.id,code:c.code,decimalPlaces:c.decimalPlaces})),accounts:accounts.map(a=>({id:a.id,name:a.accountName,type:a.type,currencyId:a.currencyId,code:a.currency.code})),categories:categories.map(c=>({id:c.id,name:c.name,type:c.type,parentId:c.parentId,status:c.status}))};
}
const criterion = <T extends string>(values:T[]) => values.length === 1 ? values[0] : {in:values};
export function reportWhere(f:ReportFilters):Prisma.TransactionWhereInput {
  const parents=selections(f.categoryId);const subs=selections(f.subcategoryId);
  const exact=subs.flatMap(id=>id==='__parent__'?parents:[id]);
  return {status:'ACTIVE',type:criterion((f.type?selections(f.type):['INCOME','EXPENSE']) as TransactionType[]),transactionDate:reportRange(f),currencyId:f.currencyId?criterion(selections(f.currencyId)):undefined,
    AND:[...(subs.length?[{categoryId:criterion(exact)}]:parents.length?[{OR:[{categoryId:criterion(parents)},{category:{parentId:criterion(parents)}}]}]:[]),...(f.q?[{OR:[{description:{contains:f.q}},{notes:{contains:f.q}},{reference:{contains:f.q}}]}]:[])],
    amount:{gte:f.min,lte:f.max},allocations:{some:{accountId:f.accountId?criterion(selections(f.accountId)):undefined,account:{type:f.accountType?criterion(selections(f.accountType) as AccountType[]):undefined}}},
  };
}
export async function loadReports(f:ReportFilters,options:Awaited<ReturnType<typeof loadReportOptions>>) {
  if(selections(f.currencyId).some(id=>!options.currencies.some(c=>c.id===id)))throw new Error('Choose valid currencies.');
  if(selections(f.accountId).some(id=>!options.accounts.some(a=>a.id===id&&matchesSelection(f.currencyId,a.currencyId)&&matchesSelection(f.accountType,a.type))))throw new Error('Choose accounts matching the currencies and account types.');
  if(selections(f.categoryId).some(id=>!options.categories.some(c=>c.id===id&&!c.parentId&&matchesSelection(f.type,c.type))))throw new Error('Choose parent categories matching the entry types.');
  if(selections(f.subcategoryId).some(id=>id!=='__parent__'&&!options.categories.some(c=>c.id===id&&c.parentId&&selections(f.categoryId).includes(c.parentId))))throw new Error('Choose subcategories belonging to the selected parents.');
  const entries=await db.transaction.findMany({where:reportWhere(f),include:{allocations:{include:{account:true}}},orderBy:[{transactionDate:'desc'},{createdAt:'desc'}]});
  return buildReports(entries,options.categories,options.currencies,f);
}
