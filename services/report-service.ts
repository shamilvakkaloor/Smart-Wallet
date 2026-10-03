import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildReports } from "@/services/report-calculation";
import { reportRange, type ReportFilters } from "@/validation/reports";
export async function loadReportOptions() {
  const [currencies,accounts,categories]=await Promise.all([
    db.currency.findMany({orderBy:{code:'asc'}}),db.account.findMany({include:{currency:true},orderBy:{accountName:'asc'}}),db.category.findMany({orderBy:[{type:'asc'},{name:'asc'}]}),
  ]);
  return {currencies:currencies.map(c=>({id:c.id,code:c.code,decimalPlaces:c.decimalPlaces})),accounts:accounts.map(a=>({id:a.id,name:a.accountName,type:a.type,currencyId:a.currencyId,code:a.currency.code})),categories:categories.map(c=>({id:c.id,name:c.name,type:c.type,parentId:c.parentId,status:c.status}))};
}
export function reportWhere(f:ReportFilters):Prisma.TransactionWhereInput {
  return {status:'ACTIVE',type:f.type?f.type:{in:['INCOME','EXPENSE']},transactionDate:reportRange(f),currencyId:f.currencyId||undefined,
    AND:[...(f.subcategoryId?[{categoryId:f.subcategoryId==='__parent__'?f.categoryId:f.subcategoryId}]:f.categoryId?[{OR:[{categoryId:f.categoryId},{category:{parentId:f.categoryId}}]}]:[]),...(f.q?[{OR:[{description:{contains:f.q}},{notes:{contains:f.q}},{reference:{contains:f.q}}]}]:[])],
    amount:{gte:f.min,lte:f.max},allocations:{some:{accountId:f.accountId||undefined,account:{type:f.accountType||undefined}}},
  };
}
export async function loadReports(f:ReportFilters,options:Awaited<ReturnType<typeof loadReportOptions>>) {
  if(f.currencyId&&!options.currencies.some(c=>c.id===f.currencyId))throw new Error('Choose a valid currency.');
  if(f.accountId&&!options.accounts.some(a=>a.id===f.accountId&&(!f.currencyId||a.currencyId===f.currencyId)&&(!f.accountType||a.type===f.accountType)))throw new Error('Choose an account matching the currency and account type.');
  if(f.categoryId&&!options.categories.some(c=>c.id===f.categoryId&&!c.parentId&&(!f.type||c.type===f.type)))throw new Error('Choose a parent category matching the entry type.');
  if(f.subcategoryId&&f.subcategoryId!=='__parent__'&&!options.categories.some(c=>c.id===f.subcategoryId&&c.parentId===f.categoryId))throw new Error('Choose a subcategory belonging to the parent category.');
  const entries=await db.transaction.findMany({where:reportWhere(f),include:{allocations:{include:{account:true}}},orderBy:[{transactionDate:'desc'},{createdAt:'desc'}]});
  return buildReports(entries,options.categories,options.currencies,f);
}
