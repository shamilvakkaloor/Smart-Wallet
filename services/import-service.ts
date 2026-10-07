import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { createEntryInTransaction } from '@/services/transaction-service';
import { readImportWorkbook, type ImportRow } from '@/lib/import-workbook';
export async function loadImportOptions(){
 const [accounts,categories]=await Promise.all([
  db.account.findMany({where:{status:'ACTIVE',currency:{status:'ACTIVE'}},include:{currency:true},orderBy:[{currency:{code:'asc'}},{accountName:'asc'}]}),
  db.category.findMany({where:{status:'ACTIVE',OR:[{parentId:null},{parent:{status:'ACTIVE'}}]},orderBy:[{type:'asc'},{name:'asc'}]})]);
 return {accounts,categories};
}
const digest=(rows:ImportRow[])=>createHash('sha256').update(JSON.stringify(rows)).digest('hex');
function sign(value:string){const secret=process.env.AUTH_SECRET;if(!secret)throw new Error('AUTH_SECRET is required for import confirmation.');return createHmac('sha256',secret).update(value).digest('hex')}
export function importToken(rows:ImportRow[],now=Date.now()){const value=`${now+15*60*1000}.${digest(rows)}`;return `${value}.${sign(value)}`}
export function verifyImportToken(token:string,rows:ImportRow[],now=Date.now()){
 const parts=token.split('.');if(parts.length!==3||!/^\d+$/.test(parts[0])||!Number.isFinite(Number(parts[0]))||Number(parts[0])<now||parts[1]!==digest(rows))throw new Error('The file or dropdown choices changed, or the preview expired. Preview this file again.');
 const expected=Buffer.from(sign(`${parts[0]}.${parts[1]}`));const supplied=Buffer.from(parts[2]);if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))throw new Error('Preview this file before importing.');
}
export async function prepareImport(buffer:Buffer){
 const parsed=await readImportWorkbook(buffer,await loadImportOptions());
 const existing=await db.transaction.findMany({where:{reference:{in:parsed.rows.map(r=>r.reference)}},select:{reference:true}});const refs=new Set(existing.map(r=>r.reference));
 return {...parsed,existing:refs};
}
export async function commitImport(rows:ImportRow[]){
 return db.$transaction(async tx=>{
  const existing=await tx.transaction.findMany({where:{reference:{in:rows.map(r=>r.reference)}},select:{reference:true}});const refs=new Set(existing.map(r=>r.reference));let imported=0;
  for(const row of rows){if(refs.has(row.reference))continue;await createEntryInTransaction(tx,row.data,row.reference);imported++}
  return {imported,skipped:rows.length-imported};
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:60000,maxWait:10000});
}
