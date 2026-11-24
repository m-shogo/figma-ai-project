import {CONNECTOR,validateConfig} from './policy.mjs';
import {describe,report,time} from './presentation.mjs';
const el=id=>document.getElementById(id);
const send=msg=>chrome.runtime.sendMessage(msg);
let data={},busy=false;
const UI_BUILD='0.2.1';
const draft=()=>({version:1,url:el('url').value.trim(),connector:CONNECTOR,prompt:'慎重に進んで',intervalMinutes:Number(el('interval').value),owner:'this-mac',exclusiveOwnerConfirmed:el('owner').checked});
function controls(){
 const pending=!!data.state?.pending,enabled=!!data.state?.enabled,owner=el('owner').checked;
 const stale=data.workerBuild!==UI_BUILD;
 el('once').disabled=busy||pending||enabled||!owner||stale;
 el('start').disabled=busy||pending||enabled||!owner||stale;
 for(const id of ['save','probe'])el(id).disabled=busy||pending||enabled||stale;
 for(const id of ['url','interval','owner'])el(id).disabled=busy||pending||enabled;
 el('refresh').disabled=busy;
 el('send-help').textContent=stale?'拡張の内部処理が旧版です。Chromeの拡張機能管理で本拡張の再読み込みを押し、その後この画面を再読み込みしてください。':pending?'前回の送信結果が未確定です。再送しないでください。':enabled?'設定変更や単発送信の前に定期送信を停止してください。':!owner?'送信には上の確認が必要です。チェック後は送信ボタンが使えます。':'送信ボタンは、画面の設定を保存してから実行します。';
 el('unsaved').textContent=['url','intervalMinutes','exclusiveOwnerConfirmed'].some(k=>draft()[k]!==data.config?.[k])?'変更は未保存です。「保存して送信」なら、この内容を保存して実行します。':'';
}
function render(){
 const v=describe(data);
 el('headline').textContent=v.title;el('guidance').textContent=v.help;el('outcome').dataset.tone=v.tone;
 el('schedule').textContent=v.schedule;el('sent').textContent=v.sent+'件';el('skipped').textContent=v.skipped+'件';
 el('next').textContent=v.next;el('cooldown').textContent=v.cooldown;
 const last=v.lastSent;
 el('last-sent').textContent=last?`最後に確認できた送信\n${time(last.confirmedAt)}\n送信先: ${last.url}\nFigma +「${last.prompt}」`:'拡張からの送信確認記録はありません。更新前の投稿はここには復元されません。';
 if(v.unknown)el('last-sent').textContent+='\n⚠ 結果未確定の試行があります。対象チャットを確認してください。';
 el('report').value=report(data);el('technical').textContent=JSON.stringify(data,null,2);controls();
}
async function refresh(){
 const result=await send({action:'status'});
 if(!result||result.event)throw Error('内部処理を確認できません。拡張を再読み込みしてください。');
 data={...result,uiBuild:UI_BUILD,versionMismatch:result.workerBuild!==UI_BUILD};render();
}
function showError(error){data={...data,lastResult:{event:'UI_ERROR',message:error.message}};render();}
async function saveDraft(){
 let config;
 try{config=validateConfig(draft());}catch{throw Error('対象URLと送信間隔を確認してください。URLは https://chatgpt.com/c/…、間隔は60分以上です。');}
 if(!await chrome.permissions.contains({origins:['https://chatgpt.com/*']})&&!await chrome.permissions.request({origins:['https://chatgpt.com/*']}))throw Error('chatgpt.comのサイト権限が必要です。許可されていないため送信しません。');
 const result=await send({action:'configure',config});
 if(result?.event!=='CONFIGURED')throw Error(describe({state:data.state,lastResult:result}).help);
}
try{await refresh();if(data.config){el('url').value=data.config.url;el('interval').value=data.config.intervalMinutes;el('owner').checked=data.config.exclusiveOwnerConfirmed;}controls();}catch(e){showError(e);}
for(const id of ['url','interval','owner'])el(id).addEventListener('input',controls);
for(const id of ['save','probe','once','start','stop','refresh'])el(id).onclick=async()=>{
 busy=true;controls();
 try{
  if(['save','probe','once','start'].includes(id))await saveDraft();
  if(!['save','refresh'].includes(id)){
   el('headline').textContent=id==='once'?'送信を確認しています…':'処理しています…';
   el('guidance').textContent=id==='once'?'完了表示まで再度押さないでください。結果が不明なら停止します。':'';
   await send({action:id});
  }
  await refresh();
 }catch(e){showError(e);}finally{busy=false;controls();}
};
async function copy(text){
 try{await navigator.clipboard.writeText(text);el('copy-feedback').textContent='コピーしました。そのままチャットに貼り付けられます。';}
 catch{el('report').value=text;el('report').focus();el('report').select();el('copy-feedback').textContent='自動コピーできませんでした。選択された文字を⌘C / Ctrl+Cでコピーしてください。';}
}
el('copy-result').onclick=()=>copy(report(data));
el('copy-prompt').onclick=()=>copy('慎重に進んで');
