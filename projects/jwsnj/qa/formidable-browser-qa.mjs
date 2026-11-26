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
    // Verify actual plugin select decoration and replay initialization without duplicate wrappers.
    const selects = form.locator('.frm_form_field select');
    assert.ok(await selects.count() > 0);
    for (const select of await selects.all()) {
      assert.equal(await select.evaluate(el => el.parentElement.classList.contains('frm_select')), true);
    }
    const formScript = await page.locator('script[src*="/js/form.js"]').first().getAttribute('src');
    await page.evaluate(() => {
      const fixture = document.createElement('div');
      fixture.id = 'file-adapter-probe';
      fixture.innerHTML = '<div class="file"><label for="qa-ordinary-file">ordinary</label><input id="qa-ordinary-file" type="file"></div><div class="wpcf7"><div class="file"><label for="qa-legacy-file">legacy</label><input id="qa-legacy-file" type="file"></div></div><form><button id="button_submit" type="submit">unrelated</button></form>';
      document.body.append(fixture);
    });
    await page.addScriptTag({url: formScript});
    const legacy = page.locator('#file-adapter-probe .wpcf7');
    const clear = legacy.locator('.clear-file');
    await clear.waitFor({state: 'attached'});
    assert.equal(await page.locator('#file-adapter-probe > .file .clear-file').count(), 0);
    assert.equal(await page.locator('#button_submit').isEnabled(), true);
    const filename = '<b>sample.txt';
    await legacy.locator('input').setInputFiles({name: filename, mimeType: 'text/plain', buffer: Buffer.from('fixture')});
    assert.equal(await legacy.locator('label').textContent(), filename);
    assert.equal(await legacy.locator('label b').count(), 0);
    await clear.click();
    assert.equal(await legacy.locator('input').evaluate(el => el.files.length), 0);
    assert.equal(await legacy.locator('label').textContent(), 'legacy');
    await page.addScriptTag({url: formScript});
    // jQuery-ready handlers run asynchronously; wait for the task before inspecting.
    await page.evaluate(() => new Promise(resolve => window.jQuery(() => setTimeout(resolve, 0))));
    assert.equal(await legacy.locator('.clear-file').count(), 1);
    for (const select of await selects.all()) {
      assert.equal(await select.evaluate(el => el.closest('.frm_select').parentElement.closest('.frm_select') === null), true);
    }
    await page.locator('#file-adapter-probe').evaluate(el => el.remove());
    console.log(JSON.stringify({engine: name, width, fileAdapter: 'PASS', selectReplay: 'PASS', unrelatedSubmit: 'PASS'}));
    // Add ordinary native controls outside the plugin; the same real theme CSS applies.
    await page.evaluate(() => {
      const fixture = document.createElement('div');
      fixture.id = 'native-choice-probe';
      fixture.innerHTML = '<button type="button" id="qa-native-start">Keyboard start</button><label><input type="checkbox" name="qa-native-check">通常チェック</label><label><input type="radio" name="qa-native-radio">通常ラジオ</label><label><input type="checkbox" name="qa-sibling"><span>通常の隣接ラベル</span></label>';
      document.body.append(fixture);
    });
    // A preceding mouse click changed Firefox's focus modality. Use actual Tab navigation.
    await page.locator('#qa-native-start').focus();
    for (const control of await page.locator('#native-choice-probe input').all()) {
      const before = await control.evaluate(el => {
        const s = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        return {appearance: s.appearance, display: s.display, width: box.width, height: box.height};
      });
      assert.notEqual(before.display, 'none');
      assert.notEqual(before.appearance, 'none');
      assert.ok(before.width > 0 && before.height > 0);
      await page.keyboard.press('Tab');
      assert.equal(await control.evaluate(el => document.activeElement === el), true, 'native choice keyboard target');
      await page.keyboard.press('Space');
      assert.equal(await control.isChecked(), true);
      const focus = await control.evaluate(el => {
        const s = getComputedStyle(el);
        return {style: s.outlineStyle, width: parseFloat(s.outlineWidth)};
      });
      assert.notEqual(focus.style, 'none');
      assert.ok(focus.width > 0);
      console.log(JSON.stringify({engine: name, width, nativeChoice: await control.getAttribute('name'), before, focus, checked: true}));
    }
    await page.locator('#native-choice-probe').evaluate(el => el.remove());
    await page.emulateMedia({reducedMotion: 'reduce'});
    const transitions = await form.locator('input[type=text], textarea, .frm_button_submit').evaluateAll(elements => elements.map(el => ({
      property: getComputedStyle(el).transitionProperty,
      duration: getComputedStyle(el).transitionDuration
    })));
    // Only text/textarea and the submit owner are under test; plugin-specific overrides must be reviewed if they win.
    assert.ok(transitions.length >= 2);
    for (const t of transitions) {
      assert.ok(t.duration.split(',').every(value => parseFloat(value) === 0), JSON.stringify(t));
    }
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.screenshot({path:'form-qa-results/'+name+'-'+width+'.png',fullPage:true});
 }
 }finally{await browser.close();}
}
