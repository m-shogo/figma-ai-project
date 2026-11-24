import {validateConfig,initialState,validState,gate} from './policy.mjs';
import {operate} from './adapter.mjs';
const ALARM='figma-continuation';
// Single writer in this extension. Persist pending BEFORE invoking the adapter.
let queue=Promise.resolve();
let cancellation=0;
let halted=false;
function serial(fn) { const next=queue.then(fn); queue=next.catch(()=>{}); return next; }
const read=()=>chrome.storage.local.get(['config','state']);
async function save(state) {
  await chrome.storage.local.set({state});
  await chrome.action.setBadgeText({text:state.enabled?'ON':'OFF'});
}
async function schedule(c,s) {
  await chrome.alarms.clear(ALARM);
  if(s.enabled && !s.pending && !halted) {
    await chrome.alarms.create(ALARM,{when:Math.max(Date.now()+60000,s.nextDue??Date.now()+c.intervalMinutes*60000)});
    if(halted)await chrome.alarms.clear(ALARM);
  }
}
async function tabFor(c) {
  const tabs=await chrome.tabs.query({url:'https://chatgpt.com/*'});
  const matches=tabs.filter(t=>t.url===c.url);
  if(matches.length!==1) throw Error(matches.length?'MULTIPLE_TARGET_TABS':'TARGET_TAB_MISSING');
  return matches[0];
}
async function invoke(c,tab,mode,attempt) {
  const r=await chrome.scripting.executeScript({target:{tabId:tab.id},func:operate,args:[{...c,mode,attempt}]});
  if(r.length!==1 || !r[0].result?.event) throw Error('ADAPTER_NO_RESULT');
  return r[0].result;
}
async function run(manual=false) {
  const generation=cancellation;
  const {config:c,state:s}=await read(); const now=Date.now();
  const decision=gate(c,s,now,manual);
  if(decision==='NOT_DUE'||decision==='DISABLED') return {event:decision};
  if(decision!=='READY') throw Error(decision);
  if(manual)halted=false;
  const t=await tabFor(c);
  const probe=await invoke(c,t,'probe');
  if(probe.event==='BUSY') {
    const next={...s,skipped:s.skipped+1,lastOutputAt:now,nextDue:now+c.intervalMinutes*60000,reason:'BUSY'};
    await save(next); await schedule(c,next); return probe;
  }
  if(probe.event!=='IDLE_EMPTY') throw Error(probe.event);
  if(generation!==cancellation) throw Error('CANCELLED');
  const pending={...s,pending:crypto.randomUUID(),lastAttempt:now,lastOutputAt:now,nextDue:now+c.intervalMinutes*60000,reason:'ATTEMPTING'};
  await save(pending);
  if(generation!==cancellation||halted) throw Error('CANCELLED');
  const outcome=await invoke(c,t,'send',pending.pending);
  if(outcome.event!=='CONFIRMED') throw Error(outcome.event);
  const current=(await read()).state;
  const stopped=current.reason!=='ATTEMPTING';
  const next={...pending,enabled:current.enabled&&!halted,pending:null,sent:s.sent+1,lastOutputAt:Date.now(),reason:stopped?'CONFIRMED_AFTER_STOP':'CONFIRMED'};
  await save(next);
  if(halted)await stop('CONFIRMED_AFTER_STOP');
  else await schedule(c,next);
  return outcome;
}
async function stop(reason='USER_STOP') {
  cancellation++;
  halted=true;
  await chrome.alarms.clear(ALARM);
  const {state}=await read();
  await chrome.storage.local.set({cancelledAttempt:state?.pending??null});
  if(validState(state)) await save({...state,enabled:false,reason,lastOutputAt:Date.now()});
}
async function dispatch(msg) {
  if(msg.action==='status') return {...await read(),alarm:await chrome.alarms.get(ALARM)};
  if(msg.action==='stop') {await stop();return {event:'STOPPED'};}
  if(msg.action==='configure') {
    const c=validateConfig(msg.config); const {state}=await read();
    if(state && (!validState(state)||state.pending)) throw Error('RECONCILE_REQUIRED');
    if(state?.enabled) throw Error('STOP_BEFORE_CONFIGURE');
    // Saving config cannot reset cooldown, counters or an uncertain attempt.
    await chrome.storage.local.set({config:c,state:state??initialState()});
    return {event:'CONFIGURED'};
  }
  if(msg.action==='probe') {const {config}=await read();validateConfig(config);return invoke(config,await tabFor(config),'probe');}
  if(msg.action==='once') return run(true);
  if(msg.action==='start') {
    const {config:c,state:s}=await read();validateConfig(c);
    if(!validState(s)||s.pending||!c.exclusiveOwnerConfirmed) throw Error('RECONCILE_OR_OWNER_REQUIRED');
    halted=false;
    const next={...s,enabled:true,nextDue:Math.max(s.nextDue??0,Date.now()+c.intervalMinutes*60000),reason:'SCHEDULED'};
    await save(next);await schedule(c,next);return {event:'SCHEDULED'};
  }
  throw Error('ACTION_INVALID');
}
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
  if(sender.id!==chrome.runtime.id || sender.url!==chrome.runtime.getURL('popup.html')) return false;
  // Emergency stop must not queue behind a slow adapter.
  if(msg.action==='stop'){stop().then(()=>reply({event:'STOPPED'}),()=>reply({event:'STOP_FAILED'}));return true;}
  serial(()=>dispatch(msg)).then(reply,async e=>{await stop(e.message);reply({event:'STOPPED',reason:e.message});});
  return true;
});
chrome.alarms.onAlarm.addListener(a=>{if(a.name===ALARM)serial(()=>run()).catch(e=>stop(e.message));});
chrome.runtime.onStartup.addListener(()=>{serial(async()=>{
  const {config:c,state:s}=await read();
  if(!c||!s)return;
  validateConfig(c);if(!validState(s)||s.pending)throw Error('RECONCILE_REQUIRED');
  if(s.enabled){const next={...s,nextDue:Date.now()+c.intervalMinutes*60000,reason:'RESTART_DELAY'};await save(next);await schedule(c,next);}
}).catch(e=>stop(e.message));});
chrome.runtime.onInstalled.addListener(()=>{serial(()=>stop('INSTALLED_OR_UPDATED')).catch(()=>{});});
// A service-worker restart may happen without a browser startup event.
serial(async()=>{
  const {config:c,state:s}=await read();
  if(!c&&!s)return;
  validateConfig(c);
  if(!validState(s)||s.pending)throw Error('RECONCILE_REQUIRED');
  if(s.enabled&&!await chrome.alarms.get(ALARM)) {
    const next={...s,nextDue:Math.max(s.nextDue??0,Date.now()+c.intervalMinutes*60000),reason:'ALARM_RECOVERED'};
    await save(next);await schedule(c,next);
  }
}).catch(e=>stop(e.message));
