import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const output=resolve('artifacts');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({
  headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']
});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',err=>errors.push(String(err)));
page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
try{
  const response=await page.goto('http://127.0.0.1:8765/demo/',{waitUntil:'domcontentloaded',timeout:45000});
  if(!response?.ok())throw new Error('Demo HTTP response not OK');
  await page.waitForFunction(()=>document.documentElement.dataset.cotativaOfficeEngine==='3',{timeout:70000});
  await page.waitForFunction(()=>window.DotOfficeEngine?.getState?.().humans===14,{timeout:20000});
  const state=await page.evaluate(()=>window.DotOfficeEngine.getState());
  if(state.stations!==14||state.humans!==14||state.humanRenderer!=='diorama-mesh'){
    throw new Error('Invalid WebGL state: '+JSON.stringify(state));
  }
  await page.screenshot({path:resolve(output,'dot-office-1440.png'),fullPage:true});
  await page.getByText('Simular pausa').click();
  await page.waitForTimeout(500);
  await page.getByText('Simular equipe trabalhando').click();
  await page.getByText('Visão geral').click();
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>errors.push('mobile: '+String(e)));
  await mobile.goto('http://127.0.0.1:8765/demo/',{waitUntil:'domcontentloaded',timeout:45000});
  await mobile.waitForFunction(()=>window.DotOfficeEngine?.getState?.().humans===14,{timeout:70000});
  await mobile.screenshot({path:resolve(output,'dot-office-mobile.png'),fullPage:true});
  const m=await mobile.evaluate(()=>window.DotOfficeEngine.getState());
  if(m.humans!==14||m.stations!==14)throw new Error('Invalid mobile state '+JSON.stringify(m));
  if(errors.length)throw new Error('Browser errors: '+errors.slice(0,5).join(' | '));
  console.log('DOT_OFFICE_PUBLIC_WEBGL_OK',JSON.stringify({desktop:state,mobile:m}));
}finally{await browser.close();}
