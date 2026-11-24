import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const output=resolve('artifacts');
await mkdir(output,{recursive:true});
async function captureStable(page,path){
  await page.evaluate(()=>window.DotOfficeEngine?.setRenderPaused?.(true));
  await page.waitForTimeout(350);
  try{
    await page.screenshot({path,fullPage:false,animations:'disabled',timeout:15000});
  }catch(err){
    console.warn('Default screenshot unavailable; retrying via Chrome DevTools:',String(err).slice(0,200));
    const cdp=await page.context().newCDPSession(page);
    const result=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:false});
    if(!result?.data)throw new Error('Chrome DevTools screenshot was empty');
    await writeFile(path,Buffer.from(result.data,'base64'));
    await cdp.detach();
  }finally{
    await page.evaluate(()=>window.DotOfficeEngine?.setRenderPaused?.(false));
  }
}
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
  await captureStable(page,resolve(output,'dot-office-1440.png'));
  // DOM click bypasses Playwright's stability wait while WebGL renders continuously.
  await page.evaluate(()=>{
    document.querySelector('[data-demo-mode="idle"]')?.click();
    document.querySelector('[data-demo-mode="working"]')?.click();
    document.querySelector('[data-dot-camera-reset]')?.click();
  });
  // Release the desktop WebGL context before allocating the mobile scene.
  // Running two live WebGL offices in parallel can exhaust the CI software GPU.
  await page.close();
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>errors.push('mobile: '+String(e)));
  await mobile.goto('http://127.0.0.1:8765/demo/',{waitUntil:'domcontentloaded',timeout:45000});
  await mobile.waitForFunction(()=>window.DotOfficeEngine?.getState?.().humans===14,{timeout:55000});
  await captureStable(mobile,resolve(output,'dot-office-mobile.png'));
  const m=await mobile.evaluate(()=>window.DotOfficeEngine.getState());
  if(m.humans!==14||m.stations!==14)throw new Error('Invalid mobile state '+JSON.stringify(m));
  if(errors.length)throw new Error('Browser errors: '+errors.slice(0,5).join(' | '));
  console.log('DOT_OFFICE_PUBLIC_WEBGL_OK',JSON.stringify({desktop:state,mobile:m}));
}finally{await browser.close();}
