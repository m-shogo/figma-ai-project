import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.argv[2] || 'http://127.0.0.1:8772/news-section.html';
const outputDir = process.argv[3] || '/tmp/ref002-budokan-wave4';
await fs.mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({headless:true});

function near(a,e,label,t=.75){if(Math.abs(a-e)>t)throw new Error(`${label}: expected ${e}, got ${a}`)}
async function run(name,width,height){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,locale:'ja-JP',timezoneId:'Asia/Tokyo',reducedMotion:'reduce'});
 await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts?.ready);
 const ev=await page.evaluate(()=>{const box=s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,bottom:r.bottom+scrollY}};return{doc:{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},section:box('.news-section'),inner:box('.news-inner'),header:box('.news-header'),categories:box('.news-categories'),list:box('.news-list'),rows:[...document.querySelectorAll('.news-row')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}),active:document.querySelector('.news-categories [aria-current="page"]')?.textContent.trim(),assetPending:document.querySelectorAll('[data-asset-status="pending"]').length}});
 if(ev.doc.scrollWidth>ev.doc.clientWidth+1)throw new Error(`${name}: horizontal overflow`);
 near(ev.section.x,0,`${name}.section.x`);near(ev.section.width,width,`${name}.section.width`);
 if(name==='pc'){
  near(ev.section.height,652,'pc.section.height');near(ev.inner.x,110,'pc.inner.x');near(ev.inner.y,100,'pc.inner.y');near(ev.inner.width,1160,'pc.inner.width');near(ev.inner.height,452,'pc.inner.height');near(ev.categories.x,110,'pc.categories.x');near(ev.categories.y,201,'pc.categories.y');near(ev.categories.width,160,'pc.categories.width');near(ev.list.x,370,'pc.list.x');near(ev.list.y,100,'pc.list.y');near(ev.list.width,900,'pc.list.width');near(ev.list.height,450,'pc.list.height');for(const [i,row] of ev.rows.entries())near(row.height,90,`pc.row${i+1}.height`);
 }else{
  near(ev.section.height,975,'sp.section.height');near(ev.inner.x,24,'sp.inner.x');near(ev.inner.y,64,'sp.inner.y');near(ev.inner.width,327,'sp.inner.width');near(ev.inner.height,847,'sp.inner.height');near(ev.header.height,60,'sp.header.height');near(ev.categories.x,24,'sp.categories.x');near(ev.categories.y,156,'sp.categories.y');near(ev.categories.width,327,'sp.categories.width');near(ev.categories.height,72,'sp.categories.height');near(ev.list.x,24,'sp.list.x');near(ev.list.y,260,'sp.list.y');near(ev.list.width,327,'sp.list.width');near(ev.list.height,651,'sp.list.height');
 }
 if(ev.rows.length!==5)throw new Error(`${name}: expected 5 articles, got ${ev.rows.length}`);if(ev.active!=='すべて')throw new Error(`${name}: wrong authored active category ${ev.active}`);if(ev.assetPending!==0)throw new Error(`${name}: News unexpectedly depends on image assets`);
 await page.screenshot({path:`${outputDir}/${name}-news-wave4.png`,fullPage:true});await page.close();return{name,width,height,evidence:ev};
}
try{const pc=await run('pc',1380,900);const sp=await run('sp',375,844);const out={generatedAt:new Date().toISOString(),evidenceDomain:'web-page',figma:{pc:{nodeId:'839:7008',width:1380,height:652},sp:{nodeId:'446:11772',width:375,height:975}},interactionEvidence:{prototypeReactionsObserved:0,filterBehaviorImplemented:false,reason:'Figma tab frames expose no prototype reactions; do not infer a filtering contract from naming alone'},pc,sp};await fs.writeFile(`${outputDir}/news-wave4-evidence.json`,JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));}finally{await browser.close();}
