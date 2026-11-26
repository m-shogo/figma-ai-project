import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const {chromium,firefox,webkit}=createRequire(process.env.CSS_QA_MODULE_ROOT+'/package.json')('playwright');
const url=process.argv[2];
assert.match(url,/^http:\/\/127\.0\.0\.1:/);
mkdirSync('form-qa-results',{recursive:true});
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch();
 try{const page=await browser.newPage({viewport:{width:375,height:900}});
 // Local fixture never submits. Block non-local resources, including remote fonts.
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
 for(const width of [375,768,1380]){
 await page.setViewportSize({width,height:900});
 const response=await page.goto(url,{waitUntil:'load'});assert.equal(response.status(),200);
 const form=page.locator('.frm_forms').first();await form.waitFor();
 const checkbox=form.locator('input[type=checkbox]').first(),radio=form.locator('input[type=radio]').first();
 await checkbox.waitFor({state:'visible'});await radio.waitFor({state:'visible'});
 for(const control of [checkbox,radio]){
 const before=await control.evaluate(el=>({appearance:getComputedStyle(el).appearance,box:el.getBoundingClientRect().toJSON(),label:el.closest('label')?.innerText}));
 assert.ok(before.box.width>0&&before.box.height>0,JSON.stringify(before));
 assert.ok(before.label?.trim(),JSON.stringify(before));
 assert.notEqual(before.appearance,'none',JSON.stringify(before));
 await control.focus();await page.keyboard.press('Space');assert.equal(await control.isChecked(),true);
 const focused=await control.evaluate(el=>({outline:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth}));
 assert.notEqual(focused.outline,'none');assert.ok(parseFloat(focused.width)>0);
 console.log(JSON.stringify({engine:name,version:browser.version(),width,type:await control.getAttribute('type'),before,focused,checked:true}));
 }
 await page.screenshot({path:'form-qa-results/'+name+'-'+width+'.png',fullPage:true});
 }
 }finally{await browser.close();}
}
