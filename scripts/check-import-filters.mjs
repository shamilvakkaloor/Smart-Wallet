import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/reports');await page.getByLabel('Currency',{exact:true}).click();await page.getByRole('checkbox',{name:'OMR',exact:true}).check();await page.getByRole('checkbox',{name:'INR',exact:true}).check();
  if(await page.locator('input[name=currencyId]').inputValue()!=='omr,inr')throw new Error('Multiple selections missing');
  await page.keyboard.press('Escape');await page.getByRole('link',{name:'Reset filters',exact:true}).click();await page.getByRole('heading',{name:'Choose your report'}).waitFor();
  if(await page.locator('input[name=currencyId]').inputValue()!=='')throw new Error('Unsaved reset did not clear');
  await page.getByLabel('Parent category',{exact:true}).click();await page.getByRole('checkbox',{name:'Food & Dining · expense',exact:true}).check();await page.getByRole('checkbox',{name:'Salary · income',exact:true}).check();await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Apply filters'}).click();await page.waitForURL(/categoryId=food%2Csalary/);await page.getByRole('heading',{name:'Choose your report'}).waitFor();
  const csv=await page.getByRole('link',{name:'Summary CSV'}).getAttribute('href');if(!csv.includes('categoryId=food%2Csalary'))throw new Error('Export lost selections');
  await page.getByRole('link',{name:'Reset filters',exact:true}).click();await page.waitForURL('http://127.0.0.1:4173/reports');await page.getByRole('heading',{name:'Choose your report'}).waitFor();
  if(await page.locator('input[name=categoryId]').inputValue()!=='')throw new Error('Applied reset did not clear');
  await page.getByLabel('Currency',{exact:true}).click();await page.screenshot({path:`design/screenshots/${device}-checkbox-reports.png`,fullPage:true});await page.keyboard.press('Escape');
  await page.goto('http://127.0.0.1:4173/entries/import');await page.getByRole('heading',{name:'Import previous transactions'}).waitFor();
  await page.route('**/api/import',route=>route.fulfill({json:{token:'test',count:1,skipped:0,rows:[{row:5,type:'EXPENSE',date:'2026-09-30',description:'Lunch',account:'Cash (OMR)',category:'Food / Dining',amount:20,details:['Cash (OMR): 12','Bank (OMR): 8'],notes:'',skipped:false}]}}));
  await page.getByLabel('Completed Excel file (.xlsx, up to 2 MB)').setInputFiles({name:'sample.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('preview fixture')});await page.getByRole('button',{name:'Preview import'}).click();await page.getByRole('button',{name:'Confirm import of 1 entry'}).waitFor();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error(`${device}: import overflow`);
  await page.screenshot({path:`design/screenshots/${device}-excel-import.png`,fullPage:true});
  if(errors.length)throw new Error(errors.join('\n'));await page.close();
 }
 console.log('Desktop/mobile checkbox selection, reset before/after Apply, CSV filter links and import preview passed.');
}finally{await browser.close()}
