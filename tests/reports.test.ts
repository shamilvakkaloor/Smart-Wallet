import { describe,expect,it,vi } from 'vitest';
import { Prisma } from '@prisma/client';
vi.mock('@/lib/db',()=>({db:{}}));
import { buildReports,type ReportEntry } from '../services/report-calculation';
import { reportWhere } from '../services/report-service';
import { parseReportFilters,reportRange } from '../validation/reports';
import { reportCsv,csvCell } from '../lib/report-csv';
const categories=[{id:'food',name:'Food',parentId:null,type:'EXPENSE',status:'ACTIVE'},{id:'dining',name:'Dining',parentId:'food',type:'EXPENSE',status:'ACTIVE'},{id:'salary',name:'Salary',parentId:null,type:'INCOME',status:'ACTIVE'}];
const currencies=[{id:'omr',code:'OMR',decimalPlaces:3},{id:'inr',code:'INR',decimalPlaces:2}];
const line=(id:string,type:string,amount:number)=>({amount:new Prisma.Decimal(amount),account:{id,type,accountName:id}});
const entry=(id:string,month:number,type:string,categoryId:string,currencyId:string,allocations:ReportEntry['allocations']):ReportEntry=>({id,reference:id,transactionDate:new Date(Date.UTC(2026,month-1,1)),type,categoryId,currencyId,description:id,amount:allocations.reduce((s,a)=>s+Number(a.amount),0),allocations});
const rows=[entry('split',1,'EXPENSE','dining','omr',[line('cash','CASH',12),line('bank','BANK',8)]),entry('direct',2,'EXPENSE','food','omr',[line('bank','BANK',0.1)]),entry('salary',1,'INCOME','salary','omr',[line('bank','BANK',100)]),entry('india',1,'INCOME','salary','inr',[line('inr','BANK',5000)])];
describe('report calculation',()=>{
 it('rolls subcategories into parents exactly once, separating cash and bank',()=>{
  const reports=buildReports(rows,categories,currencies,parseReportFilters({view:'yearly',year:2026}));const omr=reports[0];
  expect(omr.expense.total).toBe(20.1);expect(omr.expense.cash).toBe(12);expect(omr.expense.bank).toBe(8.1);
  expect(omr.rows.filter(r=>r.type==='EXPENSE')).toHaveLength(1);expect(omr.rows.find(r=>r.id==='food')?.months.slice(0,2)).toEqual([20,0.1]);
  expect(omr.income.total).toBe(100);expect(reports[1].income.total).toBe(5000);
 });
 it('counts only the chosen bank allocation of split entries',()=>{
  const report=buildReports(rows,categories,currencies,parseReportFilters({accountId:'bank',accountType:'BANK'}))[0];
  expect(report.expense.total).toBe(8.1);expect(report.expense.cash).toBe(0);expect(report.details.find(d=>d.id==='split')).toMatchObject({entryAmount:20,total:8,accounts:'bank'});
 });
 it('shows parent-only entries separately when grouping by subcategory',()=>{
  const r=buildReports(rows,categories,currencies,parseReportFilters({grouping:'subcategory'}))[0];
  expect(r.rows.find(x=>x.id==='dining')?.label).toBe('Food / Dining');expect(r.rows.find(x=>x.id==='food')?.label).toContain('General');expect(r.expense.total).toBe(20.1);
 });
 it('includes optional zero categories without changing totals',()=>{
  const r=buildReports([],categories,currencies,parseReportFilters({showZero:'1'}))[0];expect(r.rows).toHaveLength(2);expect(r.income.total).toBe(0);expect(r.expense.total).toBe(0);
 });
 it('exports the same filtered amounts, with annual month columns',()=>{
  const reports=buildReports(rows,categories,currencies,parseReportFilters({accountId:'bank'}));
  const detail=reportCsv(reports,'entries',false);expect(detail).toContain('"0","8","8","20"');expect(detail).not.toContain('"india"');
  expect(reportCsv(reports,'summary',true)).toContain('"Jan","Feb","Mar"');
 });
 it('protects spreadsheet text formulas while retaining negative numeric cells',()=>{expect(csvCell('=1+1')).toBe('"\'=1+1"');expect(csvCell(' \t@SUM(A1)')).toMatch(/^"'/);expect(csvCell(-10)).toBe('"-10"')});
});
describe('report filters',()=>{
 it('handles leap February and inclusive custom end dates in UTC',()=>{
  expect(reportRange(parseReportFilters({year:2024,month:2}))).toEqual({gte:new Date('2024-02-01'),lt:new Date('2024-03-01')});
  expect(reportRange(parseReportFilters({view:'custom',from:'2026-09-01',to:'2026-09-30'})).lt).toEqual(new Date('2026-10-01'));
 });
 it('supports the full year and all-time without arbitrary record limits',()=>{expect(reportRange(parseReportFilters({view:'yearly',year:2026}))).toEqual({gte:new Date('2026-01-01'),lt:new Date('2027-01-01')});expect(reportRange(parseReportFilters({view:'all'}))).toEqual({})});
 it('rejects impossible dates, reversed dates and amounts',()=>{
  expect(()=>parseReportFilters({view:'custom',from:'2026-02-30',to:'2026-03-01'})).toThrow();expect(()=>parseReportFilters({view:'custom',from:'2026-03-02',to:'2026-03-01'})).toThrow();expect(()=>parseReportFilters({min:'20',max:'10'})).toThrow();
 });
 it('applies date, status, type, category family, search, account and amount filters to the database query',()=>{
  const q=reportWhere(parseReportFilters({year:2026,month:9,type:'EXPENSE',categoryId:'food',accountId:'bank',accountType:'BANK',currencyId:'omr',q:'shop',min:'2',max:'50'}));
  expect(q).toMatchObject({status:'ACTIVE',type:'EXPENSE',currencyId:'omr',amount:{gte:2,lte:50},allocations:{some:{accountId:'bank',account:{type:'BANK'}}}});
  expect(JSON.stringify(q.AND)).toContain('parentId');expect(JSON.stringify(q.AND)).toContain('shop');
 });
 it('can restrict a category to entries assigned directly to the parent',()=>{
  expect(reportWhere(parseReportFilters({categoryId:'food',subcategoryId:'__parent__'})).AND).toEqual([{categoryId:'food'}]);
 });
});
