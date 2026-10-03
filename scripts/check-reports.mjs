import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
try {for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
 const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));
 for(const [name,path] of [['monthly','/reports'],['yearly','/reports?view=yearly&year=2026'],['subcategory','/reports?view=all&grouping=subcategory'],['debt-edit','/debt/d1/edit']]){
 await page.goto('http://127.0.0.1:4173'+path);await page.waitForTimeout(1500);
 if(name==='debt-edit'){if(await page.getByLabel('Amount',{exact:true}).inputValue()!=='50')errors.push('Debt edit not prefilled');}
 else {await page.getByRole('heading',{name:'OMR summary',exact:true}).waitFor();if(await page.getByRole('alert').count())errors.push('Report error');}
 if(name==='yearly'&&await page.getByRole('columnheader',{name:'Dec',exact:true}).count()!==4)errors.push('Missing annual months');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))errors.push(device+' '+name+' overflow');
 await page.screenshot({path:`design/screenshots/${device}-${name}-update.png`,fullPage:true});
 }await page.close();
}console.log({errors});if(errors.length)process.exitCode=1;}finally{await browser.close()}
