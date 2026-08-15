#!/usr/bin/env node
// Runtime-neutral Playwright section capture. Playwright is resolved from the target repo.
import fs from 'node:fs/promises';
import path from 'node:path';
const [,,contractPath,outDir='artifacts/fidelity-fast-loop']=process.argv;
if(!contractPath) throw new Error('usage: node capture-section.mjs contract.json [outDir]');
const c=JSON.parse(await fs.readFile(contractPath,'utf8'));
const { chromium }=await import('playwright');
await fs.mkdir(outDir,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:c.viewport,deviceScaleFactor:c.dpr??1,colorScheme:'light'});
await page.emulateMedia({reducedMotion:'reduce'});
if(c.freezeClock) await page.addInitScript(({now})=>{Date.now=()=>now},{now:c.freezeClock});
await page.goto(c.url,{waitUntil:'networkidle'});
await page.evaluate(async()=>{await document.fonts.ready});
await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
const rows=[];
for(const s of c.sections){
  const loc=page.locator(s.selector).first(); await loc.waitFor({state:'visible'});
  await loc.scrollIntoViewIfNeeded();
  await loc.evaluate(async el=>{
    const images=[...el.querySelectorAll('img')];
    await Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{const done=()=>resolve();img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});setTimeout(done,3000)})));
  });
  const box=await loc.boundingBox(); if(!box) throw new Error(`no box: ${s.id}`);
  const png=path.join(outDir,`${s.id}-${c.viewport.width}.png`);
  await loc.screenshot({path:png,animations:'disabled'});
  const metrics=await loc.evaluate(el=>{
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    const img=el.matches('img')?el:el.querySelector('img');
    const ir=img?.getBoundingClientRect();
    return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height,bottom:r.bottom+scrollY,fontSize:cs.fontSize,lineHeight:cs.lineHeight,color:cs.color,background:cs.backgroundColor,text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,500),...(ir?{imageBounds:{x:ir.x,y:ir.y+scrollY,width:ir.width,height:ir.height}}:{})};
  });
  rows.push({id:s.id,reference:s.reference??{},actual:metrics,capture:png});
}
await browser.close();
await fs.writeFile(path.join(outDir,'measurements.json'),JSON.stringify({sections:rows,sourceFingerprint:c.sourceFingerprint??{}},null,2)+'\n');
