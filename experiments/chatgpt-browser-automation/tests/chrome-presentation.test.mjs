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
test('legacy pending records report missing details as unknown rather than no attempt',()=>{
 const text=report({state:{pending:'old',reason:'RECONCILE_REQUIRED',lastAttempt:0}});
 assert.match(text,/詳細未記録（投稿の有無は不明）/);
 assert.match(text,/送信ボタン操作: 不明/);
 assert.doesNotMatch(text,/結果未確定の試行: なし/);
});
test('original failure and pre-click stage survive a reconciliation message',()=>{
 const text=report({state:{pending:'x',reason:'RECONCILE_REQUIRED'},lastResult:{reason:'RECONCILE_REQUIRED'},lastFailure:{reason:'UI_TIMEOUT'},attemptDetails:{outcome:{phase:'SELECT_FIGMA',clickAttempted:false}}});
 assert.match(text,/元の停止原因: UI_TIMEOUT/);assert.match(text,/処理段階: SELECT_FIGMA/);assert.match(text,/操作前に停止/);
});
test('old worker paired with new settings is explicitly blocked',()=>{
 const data={versionMismatch:true,uiBuild:'0.2.1',state:{pending:'old',reason:'UI_TIMEOUT'}};
 assert.equal(describe(data).code,'VERSION_MISMATCH');
 assert.match(report(data),/内部処理の版: 未記録/);
 assert.match(describe(data).help,/未確定の送信は解除されません/);
});
