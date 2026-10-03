import type { CurrencyReport } from "@/services/report-calculation";
export function csvCell(value:unknown) {
  let text=String(value??'');
  if(typeof value!=='number'&&/^[\s]*[=+@\-\t\r]/.test(text))text="'"+text;
  return `"${text.replaceAll('"','""')}"`;
}
export function reportCsv(reports:CurrencyReport[],format:'summary'|'entries',annual:boolean) {
  const rows:unknown[][]=[];
  if(format==='entries'){
    rows.push(['Currency','Reference','Date','Type','Description','Category / Subcategory','Accounts','Cash','Bank','Included amount','Whole entry amount']);
    for(const r of reports)for(const d of r.details)rows.push([r.currency.code,d.reference,d.date,d.type,d.description,d.category,d.accounts,d.cash,d.bank,d.total,d.entryAmount]);
  }else{
    rows.push(['Currency','Type','Category / Subcategory',...(annual?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Total']:['Cash','Bank','Total'])]);
    for(const r of reports)for(const row of [...r.rows,r.income,r.expense])rows.push([r.currency.code,row.type,row.label,...(annual?[...row.months,row.total]:[row.cash,row.bank,row.total])]);
  }
  return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
