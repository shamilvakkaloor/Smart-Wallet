import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('design/screenshots',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
try {
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
  const context=await browser.newContext({viewport,colorScheme:'light'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(`${device}: ${e.message}`));
  for(const route of ['/','/entries','/entries/new','/entries/t1','/wallets','/debt','/budgets','/reports','/data-health','/settings','/backup','/login']) {
   await page.goto('http://127.0.0.1:4173'+route);await page.waitForSelector('h1:visible, h2:visible');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350);
   if(route==='/entries/new') {
    await page.getByLabel('Category',{exact:true}).selectOption('food');
    const fields=await page.locator('#entry-amount, #entry-category, #entry-subcategory').evaluateAll(nodes=>nodes.map(n=>({y:n.getBoundingClientRect().bottom,color:getComputedStyle(n).backgroundColor})));
    if(Math.max(...fields.map(f=>f.y))-Math.min(...fields.map(f=>f.y))>2)errors.push(`${device}: entry controls are not aligned`);
    if(fields[0].color===fields[1].color || fields[1].color!==fields[2].color)errors.push(`${device}: amount-only color was not retained`);
   }
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   if(overflow) errors.push(`${device} ${route}: horizontal page overflow`);
   await page.screenshot({path:`design/screenshots/${device}-${route==='/'?'home':route.slice(1).replaceAll('/','-')}-light.png`,fullPage:true});
  }
  await page.goto('http://127.0.0.1:4173/');await page.getByRole('heading',{name:'Financial overview'}).waitFor();
  if(device==='mobile') {
   await page.getByRole('button',{name:'More',exact:true}).click();const dialog=page.getByRole('dialog');
   for(const label of ['Debt & Credit','Budgets','Reports','Data Health','Settings','Backup & Restore']) if(!await dialog.getByRole('link',{name:label,exact:true}).isVisible()) errors.push('Missing mobile section: '+label);
   await page.screenshot({path:'design/screenshots/mobile-more-light.png'});
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Add entry',exact:true}).click();
   for(const label of ['Add income','Add expense','Transfer between accounts','Exchange currencies']) if(!await page.getByRole('dialog').getByRole('link',{name:label,exact:true}).isVisible()) errors.push('Missing quick action: '+label);
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'More',exact:true}).click();
   await dialog.getByRole('button',{name:'dark theme',exact:true}).click();
   await page.keyboard.press('Escape');
  } else {
    await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
    if(await page.locator('.desktop-sidebar').evaluate(el=>el.getBoundingClientRect().width)!==88) errors.push('Sidebar did not collapse');
    await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();
    await page.getByRole('button',{name:'dark theme',exact:true}).click();
  }
  await page.waitForTimeout(100);await page.screenshot({path:`design/screenshots/${device}-home-dark.png`,fullPage:true});
  await page.goto('http://127.0.0.1:4173/entries/new');await page.getByLabel('Category',{exact:true}).selectOption('food');await page.screenshot({path:`design/screenshots/${device}-entry-dark.png`,fullPage:true});
  await context.close();
 }
 const board=await browser.newPage({viewport:{width:1440,height:1100}});await board.goto('http://127.0.0.1:4173/brand.html');await board.screenshot({path:'design/screenshots/brand-system.png',fullPage:true});await board.close();
 console.log(JSON.stringify({errors},null,2)); if(errors.length)process.exitCode=1;
} finally {await browser.close()}
