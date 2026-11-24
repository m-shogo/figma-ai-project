import test from 'node:test';
import assert from 'node:assert/strict';
import {describe,report} from '../modern/chrome/presentation.mjs';
test('existing OWNER_UNCONFIRMED state explains that no message was sent',()=>{
 const data={config:{exclusiveOwnerConfirmed:false,prompt:'慎重に進んで'},state:{enabled:false,reason:'OWNER_UNCONFIRMED',sent:0,pending:null}};
 assert.equal(describe(data).title,'送信していません');
 assert.match(describe(data).help,/未保存/);
 assert.match(report(data),/送信確認済み: 0件/);assert.match(report(data),/定期送信オフ/);
});
test('pending state overrides a prior success and never suggests retry',()=>{
 const view=describe({state:{pending:'attempt',reason:'RESULT_UNKNOWN'},lastResult:{event:'CONFIRMED'}});
 assert.equal(view.code,'RECONCILE_REQUIRED');assert.equal(view.tone,'warning');assert.match(view.help,/停止/);
});
test('copy report keeps actual sent payload distinct from current settings',()=>{
 const text=report({config:{url:'new-target',prompt:'new-prompt'},state:{sent:1},lastSent:{url:'old-target',prompt:'actual-payload',confirmedAt:0}});
 assert.match(text,/対象（設定）: new-target/);assert.match(text,/送信先: old-target/);assert.match(text,/本文: actual-payload/);
 assert.doesNotMatch(text,/&#x20;|\\\n/);
});
test('state checks and configuration are never presented as a successful send',()=>{
 for(const event of ['IDLE_EMPTY','CONFIGURED','SCHEDULED'])assert.notEqual(describe({lastResult:{event}}).title,'送信を確認しました');
 const data={lastResult:{event:'UI_ERROR',message:'入力を確認してください'}};
 assert.match(report(data),/入力を確認してください/);
});
