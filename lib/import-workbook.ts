import ExcelJS from 'exceljs';
import { randomUUID, createHash } from 'node:crypto';
import { fromBuffer } from 'yauzl';
import { apiError } from '@/lib/api-error';
import { parseEntry } from '@/services/transaction-service';
export const IMPORT_LIMIT = 200;
export const IMPORT_BYTES = 2 * 1024 * 1024;
export const HEADERS = ['Date','Type','Amount','Account','Category','Subcategory','Description','Notes','Destination account','Exchange rate','Received amount','Split account','Split amount','Import ID'];
export type ImportOptions = {
 accounts:{id:string;accountName:string;type:string;currencyId:string;currency:{code:string}}[];
 categories:{id:string;name:string;type:string;parentId:string|null}[];
};
export const accountLabel=(a:ImportOptions['accounts'][number])=>`${a.accountName} (${a.currency.code}, ${a.type})`;
export const categoryLabel=(c:ImportOptions['categories'][number])=>`${c.type}: ${c.name}`;
export type ImportRow = {row:number;reference:string;data:ReturnType<typeof parseEntry>;account:string;category:string;summary:string[]};
export async function makeImportWorkbook(options:ImportOptions) {
 const book=new ExcelJS.Workbook();book.creator='Smart Wallet';
 const sheet=book.addWorksheet('Transactions',{views:[{state:'frozen',ySplit:4,xSplit:2}]});
 sheet.mergeCells('A1:N1');sheet.getCell('A1').value='Smart Wallet — Previous transactions';sheet.getCell('A1').font={size:20,bold:true,color:{argb:'FF065F46'}};sheet.getRow(1).height=34;
 sheet.mergeCells('A2:N2');sheet.getCell('A2').value='Fill one transaction per row. Use dropdowns. Dates: YYYY-MM-DD. Keep Import IDs unchanged to prevent repeat imports.';
 sheet.mergeCells('A3:N3');sheet.getCell('A3').value='Columns I–K: transfers/exchanges. Columns L–M: optional second account for income/expense. See Guide for instructions.';
 sheet.getRow(4).values=HEADERS;sheet.getRow(4).height=32;
 const widths=[16,16,16,38,34,32,38,40,38,18,18,38,18,40];widths.forEach((w,i)=>sheet.getColumn(i+1).width=w);
 sheet.getRow(4).eachCell(c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF065F46'}};c.font={bold:true,color:{argb:'FFFFFFFF'}};c.alignment={vertical:'middle',wrapText:true}});
 sheet.autoFilter='A4:N204';
 const guide=book.addWorksheet('Guide');guide.columns=[{width:28},{width:110}];
 const instructions=[['Smart Wallet import','Download a fresh template after changing accounts or categories.'],['1. Enter transactions','Fill Transactions rows 5–204. Leave unused rows blank. Maximum 200 entries per upload; use another file for the next batch.'],['2. Choose accounts','Choose an account from its dropdown. Currency comes from that account. Only active accounts and categories are included.'],['3. Income / Expense','Choose Type, Amount, Account, Category, optional Subcategory, and Description. Amount must be positive.'],['Optional split','For a split, enter a second account and its amount in L–M. The first account receives Amount minus Split amount. Both accounts must have the same currency.'],['Transfer','Choose TRANSFER, Amount, Account (source), Destination account and Description. Accounts must differ and use the same currency. Leave category and split fields blank.'],['Exchange','Choose EXCHANGE, Amount (source), Account (source), Destination account, Exchange rate, Received amount and Description. Accounts must use different currencies.'],['Date','Use a real Excel date or text YYYY-MM-DD. Amounts support four decimal places; exchange rates support eight.'],['Import ID','Keep the generated ID with its row. Do not change it when reuploading the same transaction. Already imported IDs are skipped, including voided entries.'],['Existing transactions','Do not include transactions already entered manually or in another template. Imports add entries; corrections must use the entry Edit screen.'],['4. Upload and review','Save as .xlsx, upload under Entries → Import Excel, review the rows and totals, then confirm. Errors must be fixed before anything is imported.'],['Other entries','Debt activity and opening balances use their own app screens. This template imports income, expense, transfers and exchanges.'],['Lists','Lists contains the current dropdown choices. Do not edit it. Add accounts/categories in the app and download a new template instead.']];
 instructions.forEach((r,i)=>{guide.addRow(r);guide.getRow(i+1).height=i===0?36:48;guide.getRow(i+1).alignment={vertical:'middle',wrapText:true};guide.getCell(i+1,1).font={bold:true,color:{argb:'FF065F46'}}});
 const lists=book.addWorksheet('Lists');lists.columns=Array.from({length:9},()=>({width:42}));
 const addList=(column:number,name:string,values:string[])=>{lists.getCell(1,column).value=name;values.forEach((v,i)=>lists.getCell(i+2,column).value=v);const letter=lists.getColumn(column).letter;book.definedNames.add(`'Lists'!$${letter}$2:$${letter}$${Math.max(2,values.length+1)}`,name)};
 addList(1,'Accounts',options.accounts.map(accountLabel));addList(2,'Types',['INCOME','EXPENSE','TRANSFER','EXCHANGE']);addList(3,'INCOME_Categories',options.categories.filter(c=>!c.parentId&&c.type==='INCOME').map(categoryLabel));addList(4,'EXPENSE_Categories',options.categories.filter(c=>!c.parentId&&c.type==='EXPENSE').map(categoryLabel));addList(5,'EmptyList',[]);
 book.definedNames.add("'Lists'!$E$2",'TRANSFER_Categories');book.definedNames.add("'Lists'!$E$2",'EXCHANGE_Categories');
 const parents=options.categories.filter(c=>!c.parentId);lists.getCell('H1').value='Category';lists.getCell('I1').value='Subcategory list';
 parents.forEach((p,i)=>{const name=`Children_${i}`;addList(10+i,name,options.categories.filter(c=>c.parentId===p.id).map(c=>c.name));lists.getCell(i+2,8).value=categoryLabel(p);lists.getCell(i+2,9).value=name});
 for(let row=5;row<5+IMPORT_LIMIT;row++){
  sheet.getRow(row).height=24;sheet.getCell(row,14).value=randomUUID();
  for(let col=1;col<=14;col++){const c=sheet.getCell(row,col);c.font={size:11,color:{argb:col===14?'FF64748B':'FF164E63'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:col===3?'FFFFFBEB':row%2?'FFF1F8F5':'FFFFFFFF'}};c.alignment={vertical:'middle'};}
  sheet.getCell(row,1).numFmt='yyyy-mm-dd';[3,11,13].forEach(c=>sheet.getCell(row,c).numFmt='#,##0.0000');sheet.getCell(row,10).numFmt='0.00000000';
  for(const [col,formula] of [[2,'Types'],[4,'Accounts'],[9,'Accounts'],[12,'Accounts'],[5,`INDIRECT(IF(B${row}="","EmptyList",B${row}&"_Categories"))`],[6,`INDIRECT(IFERROR(VLOOKUP(E${row},'Lists'!$H$2:$I$${Math.max(2,parents.length+1)},2,FALSE),"EmptyList"))`]] as const){sheet.getCell(row,col).dataValidation={type:'list',allowBlank:true,formulae:[formula],showErrorMessage:true,errorStyle:'stop',errorTitle:'Choose from the dropdown',error:'Use a listed option. Download a new template for newly added accounts/categories.'}}
 }
 return book;
}
// Inspect ZIP metadata before decompression to bound the workbook parser's memory use.
async function checkArchive(buffer:Buffer){
 if(buffer.length>IMPORT_BYTES)throw new Error('Upload an .xlsx file smaller than 2 MB.');
 await new Promise<void>((resolve,reject)=>fromBuffer(buffer,{lazyEntries:true},(error,zip)=>{
  if(error||!zip){reject(new Error('This is not a valid .xlsx workbook.'));return}let size=0,count=0,expanded=0;
  zip.on('error',reject);zip.on('entry',entry=>{size+=entry.uncompressedSize;count++;if(size>20*1024*1024||count>2000||entry.generalPurposeBitFlag&1){zip.close();reject(new Error('Workbook is too large or encrypted. Use the provided template.'));return}zip.openReadStream(entry,(err,stream)=>{if(err||!stream){zip.close();reject(err??new Error('Invalid workbook archive.'));return}stream.on('error',e=>{zip.close();reject(e)});stream.on('data',(chunk:Buffer)=>{expanded+=chunk.length;if(expanded>20*1024*1024){stream.destroy();zip.close();reject(new Error('Workbook is too large.'))}});stream.on('end',()=>zip.readEntry())})});zip.on('end',resolve);zip.readEntry();
 }));
}
export async function readImportWorkbook(buffer:Buffer,options:ImportOptions):Promise<{rows:ImportRow[];errors:string[]}> {
 await checkArchive(buffer);const book=new ExcelJS.Workbook();await book.xlsx.load(buffer as unknown as ExcelJS.Buffer);
 const sheet=book.getWorksheet('Transactions');if(!sheet)throw new Error('Use the downloaded template with its Transactions sheet.');
 if(HEADERS.some((h,i)=>sheet.getCell(4,i+1).text!==h))throw new Error('The template headers changed. Download a fresh template.');
 if(sheet.rowCount>5000)throw new Error('Too many rows. Use batches of 200 transactions.');
 const rows:ImportRow[]=[],errors:string[]=[],ids=new Set<string>();let nonempty=0;
 for(let n=5;n<=sheet.rowCount;n++){
  const row=sheet.getRow(n);if(!Array.from({length:13},(_,i)=>row.getCell(i+1).value).some(v=>v!==null&&v!==''))continue;
  if(++nonempty>IMPORT_LIMIT){errors.push('Maximum 200 transactions per upload.');break}
  try{
   const cell=(col:number)=>{const v=row.getCell(col).value;if(typeof v==='boolean'||v!==null&&typeof v==='object'&&!(v instanceof Date))throw new Error(`${HEADERS[col-1]} must be a value, not a formula, link, boolean or error.`);return v};
   const text=(col:number)=>String(cell(col)??'').trim();const id=text(14);if(!/^[a-zA-Z0-9_-]{8,100}$/.test(id))throw new Error('Keep a valid Import ID from the template.');if(ids.has(id))throw new Error('Duplicate Import ID in this workbook.');ids.add(id);
   const unique=<T,>(items:T[],label:string)=>{if(items.length!==1)throw new Error(`Choose a valid ${label} from a fresh template.`);return items[0]};
   const account=unique(options.accounts.filter(a=>accountLabel(a)===text(4)),'account');const type=text(2);const date=cell(1);const transactionDate=date instanceof Date?date.toISOString().slice(0,10):String(date??'').trim();
   const base={type,transactionDate,description:text(7),notes:text(8)};let raw:unknown;let category='';let summary:string[]=[];
   if(type==='INCOME'||type==='EXPENSE'){
    const parent=unique(options.categories.filter(c=>!c.parentId&&c.type===type&&categoryLabel(c)===text(5)),'category');const child=text(6)?unique(options.categories.filter(c=>c.parentId===parent.id&&c.name===text(6)),'subcategory'):parent;category=`${parent.name}${child.id!==parent.id?' / '+child.name:''}`;
    if(text(9)||text(10)||text(11))throw new Error('Destination/exchange fields must be blank for income and expense.');
    const amount=Number(cell(3));let allocations=[{accountId:account.id,amount}];
    if(text(12)||text(13)){const second=unique(options.accounts.filter(a=>accountLabel(a)===text(12)),'split account');if(second.currencyId!==account.currencyId)throw new Error('Split accounts must use the same currency.');const part=Number(cell(13));allocations=[{accountId:account.id,amount:Number((amount-part).toFixed(4))},{accountId:second.id,amount:part}]}
    summary=allocations.map(a=>`${accountLabel(options.accounts.find(x=>x.id===a.accountId)!)}: ${a.amount}`);
    raw={...base,amount,currencyId:account.currencyId,categoryId:child.id,parentCategoryId:parent.id,allocations};
   }else{
    if(text(5)||text(6)||text(12)||text(13))throw new Error('Category and split fields must be blank for transfers/exchanges.');
    const dest=unique(options.accounts.filter(a=>accountLabel(a)===text(9)),'destination account');if(dest.id===account.id)throw new Error('Source and destination must differ.');
    summary=[`Destination: ${accountLabel(dest)}`];
    if(type==='TRANSFER'){if(dest.currencyId!==account.currencyId)throw new Error('Transfer accounts must use the same currency.');if(text(10)||text(11))throw new Error('Exchange fields must be blank for a transfer.');raw={...base,amount:cell(3),sourceAccountId:account.id,destinationAccountId:dest.id}}
    else {summary.push(`Exchange rate: ${text(10)}`,`Received: ${text(11)} ${dest.currency.code}`);if(dest.currencyId===account.currencyId)throw new Error('Exchange accounts must use different currencies.');raw={...base,sourceAmount:cell(3),sourceAccountId:account.id,destinationAccountId:dest.id,exchangeRate:cell(10),actualDestinationAmount:cell(11)}}
   }
   const data=parseEntry(raw);rows.push({row:n,reference:`IMP-${createHash('sha256').update(id).digest('hex').slice(0,40)}`,data,account:accountLabel(account),category,summary});
  }catch(e){const message=apiError(e);errors.push(`Row ${n}: ${message}`)}
 }
 if(!nonempty)errors.push('Enter at least one transaction in the template.');return {rows,errors};
}
