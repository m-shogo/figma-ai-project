// Offline simulation, no live browser/network/send. State persistence is supplied by the caller.
import { decide } from './mock-gate.mjs';
export function initialState(){return {lastSlot:null,pending:null,paused:false}}

function validState(s){
  return !!s && (s.lastSlot===null||Number.isSafeInteger(s.lastSlot)&&s.lastSlot>=0) && (s.pending===null||Number.isSafeInteger(s.pending)&&s.pending===s.lastSlot) && typeof s.paused==="boolean";
}

export function tick(s, nowMs, flags){
  if(!validState(s)||!Number.isSafeInteger(nowMs)||nowMs<0) return {state:s,event:"INVALID_STATE"};
  if(s.paused||s.pending!==null) return {state:s,event:"RECONCILE_REQUIRED"};
  const slot=Math.floor(nowMs/3600000);
  if(s.lastSlot!==null && slot<=s.lastSlot) return {state:s,event:"NOT_DUE_OR_DUPLICATE"};
  const event=decide(flags);
  const state={...s,lastSlot:slot};
  if(event==="MOCK_READY") return {state:{...state,pending:slot},event:"MOCK_ATTEMPT"};
  if(!["BUSY","NOT_DUE_OR_DUPLICATE","DISABLED"].includes(event)) state.paused=true;
  return {state,event};
}

export function settle(s, slot, outcome){
  if(!validState(s)||s.pending===null||s.pending!==slot) return {state:s,event:"UNMATCHED_RECEIPT"};
  if(outcome==="mock_confirmed" && !s.paused) return {state:{...s,pending:null},event:"MOCK_CONFIRMED"};
  return {state:{...s,paused:true},event:"RECONCILE_REQUIRED"};
}
