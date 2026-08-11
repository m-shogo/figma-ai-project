import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const widths=[320,360,375,390,430,767,768,769,1024,1200,1380];
const outDir=process.env.REF001_CAPTURE_DIR||path.resolve('experiments/ref001-blind-clean-20260812/evidence/runtime');
await fs.mkdir(outDir,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const runtimeErrors=[];
  page.on('pageerror',e=>runtimeErrors.push(`pageerror:${e.message}`));
  page.on('console',m=>{if(m.type()==='error')runtimeErrors.push(`console:${m.text()}`)});
  await page.goto('http://127.0.0.1:8765/preview.php',{waitUntil:'networkidle',timeout:60000});
  await page.evaluate(async()=>{await document.fonts.ready});
  const metrics=await page.evaluate(()=>{
    const body=document.body,de=document.documentElement;
    const sw=()=>Math.round(Math.max(body.scrollWidth,de.scrollWidth));
    const sections=[...document.querySelectorAll('[data-section]')].map((el,index)=>{const r=el.getBoundingClientRect();return{name:el.dataset.section,index,top:Math.round(r.top+scrollY),height:Math.round(r.height),bottom:Math.round(r.bottom+scrollY)}});
    const candidates=[...document.querySelectorAll('p,h1,h2,h3,li,span')].filter(el=>el.textContent.trim().length>0);
    const clipped=candidates.filter(el=>{const r=el.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5}).map(el=>({text:el.textContent.trim().replace(/\s+/g,' ').slice(0,90),left:+el.getBoundingClientRect().left.toFixed(1),right:+el.getBoundingClientRect().right.toFixed(1),className:String(el.className||'')}));
    const overflowElements=[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect();if(r.width<=0||r.height<=0||(r.left>=-.5&&r.right<=innerWidth+.5))return null;const s=getComputedStyle(el);return{tag:el.tagName.toLowerCase(),className:String(el.className||''),left:+r.left.toFixed(1),right:+r.right.toFixed(1),width:+r.width.toFixed(1),position:s.position,overflowX:s.overflowX,boxShadow:s.boxShadow,text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,80)}}).filter(Boolean).slice(0,60);
    let overflowDiagnostics=null;
    if(innerWidth===320&&sw()>innerWidth){
      const baseline=sw();
      const style=document.createElement('style');style.textContent='*::before,*::after{display:none!important}';document.head.append(style);const withoutPseudos=sw();style.remove();
      const sectionIsolation=[];
      for(const el of document.querySelectorAll('header,[data-section],footer')){const prev=el.style.display;el.style.display='none';sectionIsolation.push({name:el.dataset.section||el.className||el.tagName,scrollWidth:sw()});el.style.display=prev}
      overflowDiagnostics={baseline,withoutPseudos,sectionIsolation};
    }
    return{bodyHeight:Math.round(Math.max(body.scrollHeight,de.scrollHeight)),scrollWidth:sw(),pageOverflowPx:Math.max(0,sw()-innerWidth),readableTextClipping:clipped,overflowElements,overflowDiagnostics,primaryFonts:{zenKakuGothicNew:document.fonts.check('16px "Zen Kaku Gothic New"'),poppins:document.fonts.check('16px Poppins')},sections};
  });
  metrics.width=width;metrics.runtimeErrors=runtimeErrors;results.push(metrics);
  if([320,375,1380].includes(width))await page.screenshot({path:path.join(outDir,`first-pass-${width}.png`),fullPage:true});
  await page.close();
}
await browser.close();
await fs.writeFile(path.join(outDir,'runtime-probes.json'),JSON.stringify(results,null,2)+'\n');
const summary=results.map(x=>({width:x.width,bodyHeight:x.bodyHeight,pageOverflowPx:x.pageOverflowPx,readableTextClipping:x.readableTextClipping.length,primaryFonts:x.primaryFonts,runtimeErrors:x.runtimeErrors.length}));
console.log(JSON.stringify(summary,null,2));
for(const r of results.filter(x=>x.pageOverflowPx>0)){console.log(`OVERFLOW DEBUG @ ${r.width}px`);console.log(JSON.stringify({elements:r.overflowElements,diagnostics:r.overflowDiagnostics},null,2))}
const hardFailures=results.flatMap(x=>{const f=[];if(x.pageOverflowPx>0)f.push(`${x.width}:overflow=${x.pageOverflowPx}`);if(x.runtimeErrors.length)f.push(`${x.width}:runtimeErrors=${x.runtimeErrors.length}`);return f});
if(hardFailures.length){console.error('Runtime probe hard failures:',hardFailures.join(', '));process.exitCode=1}
