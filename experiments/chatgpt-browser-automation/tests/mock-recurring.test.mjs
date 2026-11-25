import assert from 'node:assert/strict';
import {initialState,tick,settle} from '../common/mock-recurring.mjs';
const base={"enabled":true,"offline":false,"authRequired":false,"limit":false,"owner":true,"otherExecutorActive":false,"targetVerified":true,"figmaVerified":true,"unknownPreviousSend":false,"busy":false,"draftEmpty":true,"pendingAttachment":false,"due":true,"alreadyAttempted":false,"officialPathVerified":true};
function runCases(assert){
  const H=3600000;let count=0;
  function eq(a,b,label){assert(a===b,label);count++}
  let s=initialState();
  for(let i=0;i<24;i++){
    const t=tick(s,(100+i)*H,base);eq(t.event,"MOCK_ATTEMPT","hour "+i);
    eq(tick(t.state,(100+i)*H+5,base).event,"RECONCILE_REQUIRED","inflight "+i);
    const c=settle(t.state,100+i,"mock_confirmed");eq(c.event,"MOCK_CONFIRMED","receipt "+i);
    s=JSON.parse(JSON.stringify(c.state));
    eq(tick(s,(100+i)*H+3000,base).event,"NOT_DUE_OR_DUPLICATE","repeat "+i);
  }
  const b=tick(initialState(),10*H,{...base,busy:true});eq(b.event,"BUSY","busy");
  eq(tick(b.state,10*H+3000,base).event,"NOT_DUE_OR_DUPLICATE","no late catchup");
  const later=tick(b.state,15*H,base);eq(later.event,"MOCK_ATTEMPT","sleep resume latest slot only");
  eq(later.state.pending,15,"no queued previous slots");
  const u=settle(later.state,15,"unknown");eq(u.event,"RECONCILE_REQUIRED","uncertain");
  eq(tick(JSON.parse(JSON.stringify(u.state)),16*H,base).event,"RECONCILE_REQUIRED","uncertain survives restart");
  eq(settle(u.state,15,"mock_confirmed").event,"RECONCILE_REQUIRED","late receipt does not unpause");
  eq(settle(later.state,14,"mock_confirmed").event,"UNMATCHED_RECEIPT","wrong receipt");
  eq(tick(s,90*H,base).event,"NOT_DUE_OR_DUPLICATE","clock rollback");
  for(const [patch,expected] of [[{limit:true},"LIMIT"],[{authRequired:true},"AUTH_REQUIRED"],[{offline:true},"OFFLINE"],[{figmaVerified:false},"TARGET_UNCONFIRMED"],[{officialPathVerified:false},"PATH_UNVERIFIED"],[{otherExecutorActive:true},"OWNER_UNCONFIRMED"],[{draftEmpty:false},"DRAFT_OR_ATTACHMENT"]]){
    const a=tick(initialState(),10*H,{...base,...patch});eq(a.event,expected,expected);eq(tick(a.state,11*H,base).event,"RECONCILE_REQUIRED","pause persists "+expected);
  }
  eq(tick({},10*H,base).event,"INVALID_STATE","bad state");
  eq(tick(initialState(),NaN,base).event,"INVALID_STATE","bad clock");
  return count;
}
console.log(runCases((ok,label)=>assert.ok(ok,label))+' mock recurring assertions passed');
