// Exercises the actual service-worker message API with an in-memory Chrome API.
// No browser UI simulation or live-send claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {CONNECTOR,initialState} from '../modern/chrome/policy.mjs';
const config={version:1,url:'https://chatgpt.com/c/00000000-0000-0000-0000-000000000000',connector:CONNECTOR,prompt:'慎重に進んで',intervalMinutes:60,owner:'this-mac',exclusiveOwnerConfirmed:true};
async function harness({outcome='CONFIRMED',state=initialState(),probe='IDLE_EMPTY'}={}){
  const db={config:structuredClone(config),state:structuredClone(state)};
  let listener,alarm=state.enabled?{when:Date.now()+3600000}:null,calls=0,ready,release;
  const entered=new Promise(resolve=>ready=resolve);
  const hold=new Promise(resolve=>release=resolve);
  globalThis.chrome={
    storage:{local:{get:async()=>structuredClone(db),set:async values=>Object.assign(db,structuredClone(values))}},
    action:{setBadgeText:async()=>{}},
    tabs:{query:async()=>[{id:1,url:db.config.url}]},
    alarms:{get:async()=>alarm,clear:async()=>{alarm=null;},create:async(_name,a)=>{alarm=a;},onAlarm:{addListener(){}}},
    scripting:{executeScript:async ({args})=>{
      if(args[0].mode==='probe')return [{result:{event:probe}}];
      calls++;assert.ok(db.state.pending,'intent must be persisted before any UI send');
      if(outcome==='HOLD'){ready();await hold;return [{result:{event:db.state.reason==='ATTEMPTING'?'CONFIRMED':'CANCELLED'}}];}
      return [{result:{event:outcome}}];
    }},
    runtime:{id:'test',getURL:p=>'chrome-extension://test/'+p,onMessage:{addListener(fn){listener=fn;}},onStartup:{addListener(){}},onInstalled:{addListener(){}}}
  };
  await import('../modern/chrome/worker.mjs?run='+crypto.randomUUID());
  const message=msg=>new Promise(resolve=>listener(msg,{id:'test',url:'chrome-extension://test/popup.html',tab:{id:2}},resolve));
  await message({action:'status'}); // Wait for startup recovery.
  return {db,message,get calls(){return calls;},entered,release,rejects:sender=>listener({action:'once'},sender,()=>{throw Error('Unexpected reply');})===false};
}
test('confirmed receipt persists and immediate/manual duplicate cannot send',async()=>{
  const h=await harness();assert.equal((await h.message({action:'once'})).event,'CONFIRMED');
  assert.equal(h.db.state.sent,1);assert.equal(h.db.state.pending,null);
  assert.equal((await h.message({action:'once'})).event,'NOT_DUE');assert.equal(h.calls,1);
  assert.equal(h.db.lastSent.prompt,config.prompt);
  assert.equal(h.db.lastSent.url,config.url);
  assert.equal(h.db.lastSent.receipt,'USER_MESSAGE_CONFIRMED');
  await h.message({action:'configure',config:{...config,url:config.url.replace('00000000-','11111111-')}});
  assert.equal(h.db.lastSent.url,config.url,'changing settings must not rewrite the sent record');
});
test('uncertain receipt survives worker restart and config cannot erase it',async()=>{
  const h=await harness({outcome:'RESULT_UNKNOWN'});await h.message({action:'once'});
  assert.equal(h.db.lastSent,undefined,'uncertain send must never create a confirmed receipt');
  assert.equal(h.db.lastResult.reason,'RESULT_UNKNOWN');
  assert.equal(h.db.state.enabled,false);assert.ok(h.db.state.pending);
  const next=await harness({state:h.db.state});
  await next.message({action:'once'});await next.message({action:'configure',config});
  assert.ok(next.db.state.pending);assert.equal(next.calls,0);
});
test('emergency stop is handled while a send is pending',async()=>{
  const h=await harness({outcome:'HOLD',state:{...initialState(),enabled:true}});
  const running=h.message({action:'once'});await h.entered;
  assert.equal((await h.message({action:'stop'})).event,'STOPPED');
  assert.equal(h.db.state.enabled,false);h.release();await running;
  assert.equal(h.db.state.enabled,false);assert.equal(h.db.state.sent,0);assert.ok(h.db.state.pending);
});
test('busy skips and schedules future time; unconfirmed owner never reaches UI',async()=>{
  const h=await harness({probe:'BUSY',state:{...initialState(),enabled:true}});
  assert.equal((await h.message({action:'once'})).event,'BUSY');assert.equal(h.db.state.skipped,1);assert.equal(h.calls,0);
  const other=await harness();other.db.config.exclusiveOwnerConfirmed=false;
  assert.equal((await other.message({action:'once'})).reason,'OWNER_UNCONFIRMED');assert.equal(other.calls,0);
});
test('only the extension settings page may invoke worker actions',async()=>{
  const h=await harness();
  assert.ok(h.rejects({id:'test',url:config.url,tab:{id:1}}));
  assert.ok(h.rejects({id:'another-extension',url:'chrome-extension://test/popup.html'}));
  assert.ok(h.rejects({id:'test',url:'chrome-extension://test/unexpected.html'}));
  assert.equal(h.calls,0);
});
test('legacy pending failure is preserved when startup requires reconciliation',async()=>{
 const h=await harness({state:{...initialState(),pending:'old-attempt',reason:'UI_TIMEOUT',lastAttempt:0}});
 assert.equal(h.db.lastFailure.reason,'UI_TIMEOUT');
 assert.equal(h.db.state.reason,'RECONCILE_REQUIRED');
 const result=await h.message({action:'status'});
 assert.equal(result.workerBuild,'0.2.1');
 assert.equal(h.calls,0);
});
