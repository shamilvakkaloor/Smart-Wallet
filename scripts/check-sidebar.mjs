import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage();const errors=[];
 for(const [width,height] of [[1920,980],[1536,784],[1280,720],[1024,650],[1280,500]]) {
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4173/');await page.getByRole('heading',{name:'Financial overview'}).waitFor();await page.evaluate(()=>document.fonts.ready);
  const result=await page.locator('.desktop-sidebar').evaluate(el=>{const nav=el.querySelector('.sidebar-navigation');const footer=el.querySelector('.sidebar-footer');return {horizontal:el.scrollWidth>el.clientWidth,vertical:el.scrollHeight>el.clientHeight,navScroll:nav.scrollHeight>nav.clientHeight,footerBottom:footer.getBoundingClientRect().bottom,buttons:[...el.querySelectorAll('.segmented button')].map(b=>({width:b.clientWidth,scroll:b.scrollWidth}))}});
  console.log(width,height,result);if(result.horizontal||result.vertical||result.footerBottom>height||result.buttons.some(b=>b.scroll>b.width)||height>=650&&result.navScroll)errors.push(`${width}x${height} sidebar overflow`);
  await page.getByRole('button',{name:'dark theme',exact:true}).first().click();await page.getByRole('button',{name:'light theme',exact:true}).first().click();
  await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();if(await page.locator('.desktop-sidebar').evaluate(el=>el.scrollWidth>el.clientWidth))errors.push('Collapsed overflow');await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();
  if(height===720)await page.screenshot({path:'design/screenshots/sidebar-fit-desktop.png'});
 }
 if(errors.length)throw new Error(errors.join('\n'));
} finally {await browser.close()}
