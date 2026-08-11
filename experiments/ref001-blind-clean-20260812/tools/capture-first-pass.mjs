import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const widths = [320,360,375,390,430,767,768,769,1024,1200,1380];
const outDir = process.env.REF001_CAPTURE_DIR || path.resolve('experiments/ref001-blind-clean-20260812/evidence/runtime');
await fs.mkdir(outDir,{recursive:true});
const browser = await chromium.launch({headless:true});
const results=[];
for (const width of widths) {
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const runtimeErrors=[];
  page.on('pageerror',e=>runtimeErrors.push(`pageerror:${e.message}`));
  page.on('console',m=>{ if(m.type()==='error') runtimeErrors.push(`console:${m.text()}`); });
  await page.goto('http://127.0.0.1:8765/preview.php',{waitUntil:'networkidle',timeout:60000});
  await page.evaluate(async()=>{ await document.fonts.ready; });
  const metrics=await page.evaluate(()=>{
    const body=document.body,de=document.documentElement;
    const sections=[...document.querySelectorAll('[data-section]')].map((el,index)=>{
      const r=el.getBoundingClientRect();
      return {name:el.dataset.section,index,top:Math.round(r.top+scrollY),height:Math.round(r.height),bottom:Math.round(r.bottom+scrollY)};
    });
    const candidates=[...document.querySelectorAll('p,h1,h2,h3,li,span')].filter(el=>el.textContent.trim().length>0);
    const clipped=candidates.filter(el=>{
      const r=el.getBoundingClientRect();
      return r.left < -0.5 || r.right > innerWidth + 0.5;
    }).map(el=>({text:el.textContent.trim().replace(/\s+/g,' ').slice(0,90),left:+el.getBoundingClientRect().left.toFixed(1),right:+el.getBoundingClientRect().right.toFixed(1),className:String(el.className||'')}));
    return {
      bodyHeight:Math.round(Math.max(body.scrollHeight,de.scrollHeight)),
      scrollWidth:Math.round(Math.max(body.scrollWidth,de.scrollWidth)),
      pageOverflowPx:Math.max(0,Math.round(Math.max(body.scrollWidth,de.scrollWidth)-innerWidth)),
      readableTextClipping:clipped,
      primaryFonts:{
        zenKakuGothicNew:document.fonts.check('16px "Zen Kaku Gothic New"'),
        poppins:document.fonts.check('16px Poppins')
      },
      sections
    };
  });
  metrics.width=width;
  metrics.runtimeErrors=runtimeErrors;
  results.push(metrics);
  if(width===375 || width===1380){
    await page.screenshot({path:path.join(outDir,`first-pass-${width}.png`),fullPage:true});
  }
  await page.close();
}
await browser.close();
await fs.writeFile(path.join(outDir,'runtime-probes.json'),JSON.stringify(results,null,2)+'\n');
const summary=results.map(x=>({width:x.width,bodyHeight:x.bodyHeight,pageOverflowPx:x.pageOverflowPx,readableTextClipping:x.readableTextClipping.length,primaryFonts:x.primaryFonts,runtimeErrors:x.runtimeErrors.length}));
console.log(JSON.stringify(summary,null,2));
const hardFailures=results.flatMap(x=>{
  const f=[];
  if(x.pageOverflowPx>0) f.push(`${x.width}:overflow=${x.pageOverflowPx}`);
  if(x.runtimeErrors.length) f.push(`${x.width}:runtimeErrors=${x.runtimeErrors.length}`);
  return f;
});
if(hardFailures.length){ console.error('Runtime probe hard failures:',hardFailures.join(', ')); process.exitCode=1; }
