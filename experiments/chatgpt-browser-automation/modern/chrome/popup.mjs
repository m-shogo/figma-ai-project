import {CONNECTOR} from './policy.mjs';
const el=id=>document.getElementById(id);
const send=msg=>chrome.runtime.sendMessage(msg);
const status=async()=>{const data=await send({action:'status'});if(!data)throw Error('拡張の内部処理から応答がありません。拡張を再読み込みしてください。');el('status').textContent=JSON.stringify(data,null,2);return data;};
let data={};
try{data=await status();}catch(e){el('status').textContent=e.message;}
if(data.config){el('url').value=data.config.url;el('interval').value=data.config.intervalMinutes;el('owner').checked=data.config.exclusiveOwnerConfirmed;}
for(const id of ['save','probe','once','start','stop']) el(id).onclick=async()=>{
  const buttons=[...document.querySelectorAll('button')];
  buttons.forEach(b=>b.disabled=b.id!=='stop');
  try{
    let result;
    if(id==='save'){
      // Permission request is tied to this explicit user gesture.
      if(!await chrome.permissions.request({origins:['https://chatgpt.com/*']}))throw Error('サイト権限が許可されていません');
      result=await send({action:'configure',config:{version:1,url:el('url').value.trim(),connector:CONNECTOR,prompt:'慎重に進んで',intervalMinutes:Number(el('interval').value),owner:'this-mac',exclusiveOwnerConfirmed:el('owner').checked}});
    }else result=await send({action:id});
    await status();el('status').textContent+='\n'+JSON.stringify(result);
  }catch(e){el('status').textContent=e.message;}
  finally{buttons.forEach(b=>b.disabled=false);}
};
