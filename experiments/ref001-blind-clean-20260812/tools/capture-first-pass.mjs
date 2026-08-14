import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const widths=[320,360,375,390,430,767,768,769,1024,1200,1380];
const fluidMobileWidths=new Set([390,430,767]);
const intermediateDesktopWidths=new Set([768,769,1024,1200]);
const screenshotWidths=new Set([320,375,430,767,768,1024,1200,1380]);
const outDir=process.env.REF001_CAPTURE_DIR||path.resolve('experiments/ref001-blind-clean-20260812/evidence/runtime');
await fs.mkdir(outDir,{recursive:true});
const browser=await chromium.launch({headless:true});
const browserVersion=browser.version();
const results=[];
for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
  const runtimeErrors=[];
  page.on('pageerror',e=>runtimeErrors.push(`pageerror:${e.message}`));
  page.on('console',m=>{if(m.type()==='error')runtimeErrors.push(`console:${m.text()}`)});
  await page.goto('http://127.0.0.1:8765/preview.php',{waitUntil:'networkidle',timeout:60000});
  await page.evaluate(async()=>{await document.fonts.ready});

  // Full-page screenshots are not guaranteed to trigger native lazy loading.
  // Exercise the real page from top to bottom first so visual evidence contains
  // every canonical raster asset instead of gray unloaded placeholders.
  await page.evaluate(async()=>{
    const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const height=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
    const step=Math.max(400,Math.floor(innerHeight*.75));
    for(let y=0;y<height;y+=step){scrollTo(0,y);await sleep(35)}
    scrollTo(0,Math.max(0,height-innerHeight));
    await sleep(80);
    await Promise.all([...document.images].map(img=>{
      if(img.complete)return Promise.resolve();
      return new Promise(resolve=>{
        const done=()=>resolve();
        img.addEventListener('load',done,{once:true});
        img.addEventListener('error',done,{once:true});
        setTimeout(done,3000);
      });
    }));
    scrollTo(0,0);
    await sleep(80);
  });

  const metrics=await page.evaluate(({isIntermediateDesktop,isFluidMobile})=>{
    const body=document.body,de=document.documentElement;
    const sw=()=>Math.round(Math.max(body.scrollWidth,de.scrollWidth));
    const rect=selector=>document.querySelector(selector)?.getBoundingClientRect()||null;
    const sections=[...document.querySelectorAll('[data-section]')].map((el,index)=>{const r=el.getBoundingClientRect();return{name:el.dataset.section,index,top:Math.round(r.top+scrollY),height:Math.round(r.height),bottom:Math.round(r.bottom+scrollY)}});
    const candidates=[...document.querySelectorAll('p,h1,h2,h3,li,span')].filter(el=>el.textContent.trim().length>0);
    const clipped=candidates.filter(el=>{const r=el.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5}).map(el=>({text:el.textContent.trim().replace(/\s+/g,' ').slice(0,90),left:+el.getBoundingClientRect().left.toFixed(1),right:+el.getBoundingClientRect().right.toFixed(1),className:String(el.className||'')}));
    const overflowElements=[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect();if(r.width<=0||r.height<=0||(r.left>=-.5&&r.right<=innerWidth+.5))return null;const s=getComputedStyle(el);return{tag:el.tagName.toLowerCase(),className:String(el.className||''),left:+r.left.toFixed(1),right:+r.right.toFixed(1),width:+r.width.toFixed(1),position:s.position,overflowX:s.overflowX,boxShadow:s.boxShadow,text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,80)}}).filter(Boolean).slice(0,60);
    const imageFailures=[...document.images].filter(img=>!img.complete||img.naturalWidth===0||img.naturalHeight===0).map(img=>({slot:img.closest('[data-asset-slot]')?.dataset.assetSlot||null,src:img.currentSrc||img.src||'',complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}));
    let overflowDiagnostics=null;
    if(innerWidth===320&&sw()>innerWidth){
      const baseline=sw();
      const style=document.createElement('style');style.textContent='*::before,*::after{display:none!important}';document.head.append(style);const withoutPseudos=sw();style.remove();
      const sectionIsolation=[];
      for(const el of document.querySelectorAll('header,[data-section],footer')){const prev=el.style.display;el.style.display='none';sectionIsolation.push({name:el.dataset.section||el.className||el.tagName,scrollWidth:sw()});el.style.display=prev}
      overflowDiagnostics={baseline,withoutPseudos,sectionIsolation};
    }

    const layoutContractFailures=[];
    let fluidMobile=null;
    if(isFluidMobile){
      const expectedRail=Math.min(560,innerWidth-32);
      const railSelectors=['.ref-mv__copy','.ref-education .ref-content','.ref-voice-item--open>.ref-content','.ref-messages__body','.ref-courses .ref-content'];
      const rails=railSelectors.map(selector=>{const r=rect(selector);return{selector,width:r?+r.width.toFixed(1):null,left:r?+r.left.toFixed(1):null,right:r?+r.right.toFixed(1):null}});
      const railFailures=rails.filter(x=>x.width===null||Math.abs(x.width-expectedRail)>1.5).map(x=>`${x.selector}:${x.width}`);
      fluidMobile={expectedRail,rails,railFailures};
      if(railFailures.length)layoutContractFailures.push(`fluid-mobile-rails=${railFailures.join('|')}`);
    }

    let intermediateDesktop=null;
    if(isIntermediateDesktop){
      const reasonHeading=rect('.ref-reason__head h2');
      const reasonIntro=rect('.ref-reason__intro');
      const educationCards=[...document.querySelectorAll('.ref-education .ref-edu-card')].map(el=>el.getBoundingClientRect());
      const voiceAvatar=rect('.ref-voice-item--open .ref-avatar');
      const voiceSpeech=rect('.ref-voice-item--open .ref-speech');
      const reasonOverlapPx=reasonHeading&&reasonIntro?Math.max(0,reasonHeading.bottom-reasonIntro.top):null;
      const educationCardTopSpreadPx=educationCards.length?Math.max(...educationCards.map(r=>r.top))-Math.min(...educationCards.map(r=>r.top)):null;
      const voiceAvatarSpeechOverlapPx=voiceAvatar&&voiceSpeech?Math.max(0,Math.min(voiceAvatar.right,voiceSpeech.right)-Math.max(voiceAvatar.left,voiceSpeech.left)):null;

      const courseCards=[...document.querySelectorAll('.ref-course')];
      const courseCompositionFailures=[];
      for(const [index,card] of courseCards.entries()){
        const cr=card.getBoundingClientRect();
        const icon=card.querySelector('.ref-course__icon')?.getBoundingClientRect()||null;
        const title=card.querySelector('h3')?.getBoundingClientRect()||null;
        const desc=card.querySelector('.ref-course__desc')?.getBoundingClientRect()||null;
        const rec=card.querySelector('.ref-course__rec')?.getBoundingClientRect()||null;
        const inside=(r)=>r&&r.width>0&&r.height>0&&r.left>=cr.left-1&&r.right<=cr.right+1&&r.top>=cr.top-1&&r.bottom<=cr.bottom+1;
        if(!inside(icon)||icon.width<70||icon.height<70)courseCompositionFailures.push(`${index+1}:icon`);
        if(!inside(title)||title.left<cr.left+88)courseCompositionFailures.push(`${index+1}:title`);
        if(!inside(desc)||desc.left<cr.left+88)courseCompositionFailures.push(`${index+1}:desc`);
        if(!inside(rec)||rec.width<cr.width*.8||rec.top<cr.top+135)courseCompositionFailures.push(`${index+1}:rec`);
      }

      intermediateDesktop={reasonOverlapPx,educationCardTopSpreadPx,voiceAvatarSpeechOverlapPx,courseCompositionFailures};
      if(reasonOverlapPx===null||reasonOverlapPx>.5)layoutContractFailures.push(`reason-heading-overlap=${reasonOverlapPx}`);
      if(educationCardTopSpreadPx===null||educationCardTopSpreadPx>2)layoutContractFailures.push(`education-row-spread=${educationCardTopSpreadPx}`);
      if(voiceAvatarSpeechOverlapPx===null||voiceAvatarSpeechOverlapPx>.5)layoutContractFailures.push(`voice-avatar-speech-overlap=${voiceAvatarSpeechOverlapPx}`);
      if(courseCards.length!==7||courseCompositionFailures.length)layoutContractFailures.push(`courses=${courseCompositionFailures.join('|')||`count-${courseCards.length}`}`);
    }

    return{bodyHeight:Math.round(Math.max(body.scrollHeight,de.scrollHeight)),scrollWidth:sw(),pageOverflowPx:Math.max(0,sw()-innerWidth),readableTextClipping:clipped,overflowElements,overflowDiagnostics,imageFailures,fluidMobile,intermediateDesktop,layoutContractFailures,primaryFonts:{zenKakuGothicNew:document.fonts.check('16px "Zen Kaku Gothic New"'),poppins:document.fonts.check('16px Poppins')},sections};
  },{isIntermediateDesktop:intermediateDesktopWidths.has(width),isFluidMobile:fluidMobileWidths.has(width)});
  metrics.width=width;
  metrics.runtimeErrors=runtimeErrors;
  metrics.captureEnvironment={browser:'chromium',browserVersion,platform:process.platform,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'};
  results.push(metrics);
  if(screenshotWidths.has(width))await page.screenshot({path:path.join(outDir,`first-pass-${width}.png`),fullPage:true,animations:'disabled',caret:'hide'});
  await page.close();
}
await browser.close();
await fs.writeFile(path.join(outDir,'runtime-probes.json'),JSON.stringify(results,null,2)+'\n');
const summary=results.map(x=>({width:x.width,bodyHeight:x.bodyHeight,pageOverflowPx:x.pageOverflowPx,readableTextClipping:x.readableTextClipping.length,imageFailures:x.imageFailures.length,layoutContractFailures:x.layoutContractFailures.length,fluidMobile:x.fluidMobile,intermediateDesktop:x.intermediateDesktop,primaryFonts:x.primaryFonts,runtimeErrors:x.runtimeErrors.length,captureEnvironment:x.captureEnvironment}));
console.log(JSON.stringify(summary,null,2));
for(const r of results.filter(x=>x.pageOverflowPx>0)){console.log(`OVERFLOW DEBUG @ ${r.width}px`);console.log(JSON.stringify({elements:r.overflowElements,diagnostics:r.overflowDiagnostics},null,2))}
for(const r of results.filter(x=>x.imageFailures.length)){console.log(`IMAGE DEBUG @ ${r.width}px`);console.log(JSON.stringify(r.imageFailures,null,2))}
for(const r of results.filter(x=>x.layoutContractFailures.length)){console.log(`LAYOUT CONTRACT DEBUG @ ${r.width}px`);console.log(JSON.stringify({fluidMobile:r.fluidMobile,intermediateDesktop:r.intermediateDesktop,failures:r.layoutContractFailures},null,2))}
const hardFailures=results.flatMap(x=>{const f=[];if(x.pageOverflowPx>0)f.push(`${x.width}:overflow=${x.pageOverflowPx}`);if(x.imageFailures.length)f.push(`${x.width}:imageFailures=${x.imageFailures.length}`);if(x.runtimeErrors.length)f.push(`${x.width}:runtimeErrors=${x.runtimeErrors.length}`);if(x.layoutContractFailures.length)f.push(`${x.width}:layout=${x.layoutContractFailures.join('|')}`);return f});
if(hardFailures.length){console.error('Runtime probe hard failures:',hardFailures.join(', '));process.exitCode=1}
