const messages={
 OWNER_UNCONFIRMED:['送信していません','並行実装がないことの確認が未保存です。下の確認にチェックし「保存して送信」を押してください。'],
 RECONCILE_OR_OWNER_REQUIRED:['開始していません','並行実装の確認、または前回の送信結果の確認が必要です。'],
 IDLE_EMPTY:['送信できる画面です','対象チャットの入力欄は空です。状態確認だけなので、まだ送信していません。'],
 CONFIRMED:['送信を確認しました','対象チャットへの投稿を確認しました。Figma取得や案件実装の成功とは別です。'],
 RESULT_UNKNOWN:['送信結果を確認できません','送信された可能性があります。チャットを確認するまで再送しないでください。'],
 RECONCILE_REQUIRED:['前回の結果確認が必要です','自動再送を停止しています。対象チャットと下書きを確認してください。'],
 BUSY:['今回は送信を見送りました','ChatGPTが生成中です。定期実行中なら次の間隔で再確認します。'],
 NOT_DUE:['まだ送信しません','連投を防ぐため待機しています。「次に送信できる時刻」を確認してください。'],
 DRAFT_EXISTS:['送信していません','入力欄に下書きがあります。上書きせず停止しました。'],
 TARGET_TAB_MISSING:['送信していません','指定したチャットをChromeで開いてください。'],
 MULTIPLE_TARGET_TABS:['送信していません','同じ対象チャットが複数開いています。対象タブを1枚にしてください。'],
 OFFLINE:['通信が切れています','ネットワークを確認してください。自動再送はしていません。'],
 AUTH_REQUIRED:['ログインが必要です','ChatGPTの正規画面でログインしてください。認証は自動操作しません。'],
 LIMIT:['利用上限のため停止しました','利用枠が回復するまで送信しません。'],
 USER_STOP:['停止しました','定期送信はオフです。送信済みの投稿は取り消されません。'],
 CONFIGURED:['設定を保存しました','設定を保存しただけです。メッセージは送信していません。'],
 SCHEDULED:['定期送信を予約しました','今すぐの送信はありません。次回予定からChromeだけで実行します。'],
 NOT_STARTED:['まだ送信していません','対象と送信内容を確認して、初回の送信を試してください。'],
 INSTALLED_OR_UPDATED:['定期送信は停止中です','拡張の更新後は安全のため停止します。設定と結果を確認してください。']
};
export const time=ms=>Number.isSafeInteger(ms)?new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'short',timeStyle:'medium'}).format(ms)+' JST':'なし';
export function describe(data={}){
 const s=data.state??{},r=data.lastResult;
 let code=r?.reason||r?.event||s.reason||'NOT_STARTED';
 if(s.pending)code=s.reason==='ATTEMPTING'?'RESULT_UNKNOWN':'RECONCILE_REQUIRED';
 const [title,help]=code==='UI_ERROR'?['実行できませんでした',r.message]:messages[code]??['安全のため停止しました','画面や選択状態を確認できません。「結果をコピー」で診断結果を共有してください。'];
 if(data.versionMismatch)return {code:'VERSION_MISMATCH',title:'拡張の再読み込みが必要です',help:'設定画面と内部処理の版が一致していません。Chromeの拡張機能管理で本拡張を再読み込みし、その後に設定画面を再読み込みしてください。未確定の送信は解除されません。',tone:'warning',schedule:s.enabled?'定期送信オン':'定期送信オフ',sent:s.sent??0,skipped:s.skipped??0,next:'確認できません',cooldown:time(s.nextDue),lastSent:data.lastSent??null,unknown:!!s.pending};
 return {code,title,help,tone:s.pending?'warning':code==='CONFIRMED'?'success':code==='IDLE_EMPTY'?'ready':'neutral',schedule:s.enabled?'定期送信オン':'定期送信オフ',sent:s.sent??0,skipped:s.skipped??0,next:s.enabled?time(data.alarm?.scheduledTime??s.nextDue):'予定なし',cooldown:time(s.nextDue),lastSent:data.lastSent??null,unknown:!!s.pending};
}
export function report(data={}){
 const v=describe(data),c=data.config??{},last=v.lastSent;
 const attempt=data.attemptDetails,failed=data.lastFailure??data.lastResult;
 const attemptText=data.state?.pending?`結果未確定の試行: ${time(attempt?.at??data.state.lastAttempt)} / ${attempt?.prompt??'詳細未記録（投稿の有無は不明）'}`:'結果未確定の送信: なし';
 const diagnostic=`設定画面の版: ${data.uiBuild??'未記録'} / 内部処理の版: ${data.workerBuild??'未記録'}\n元の停止原因: ${failed?.reason??failed?.event??data.state?.reason??'未記録'}\n処理段階: ${attempt?.outcome?.phase??'未記録'}\n送信ボタン操作: ${attempt?.outcome?.clickAttempted===true?'試行あり（投稿確認とは別）':attempt?.outcome?.clickAttempted===false?'操作前に停止':'不明'}`;
 return ['Figma継続送信の結果',`状態: ${v.title}`,`理由: ${v.help}`,`診断コード: ${v.code}`,diagnostic,`定期実行: ${v.schedule}`,`送信確認済み: ${v.sent}件 / 見送り: ${v.skipped}件`,`次回予定: ${v.next}`,`次に送信できる時刻: ${v.cooldown}`,`対象（設定）: ${c.url??'未設定'}`,`送信予定: Figma +「${c.prompt??'慎重に進んで'}」`,last?`最後に確認できた送信: ${time(last.confirmedAt)}\n送信先: ${last.url}\nアプリ: Figma\n本文: ${last.prompt}`:'最後に確認できた送信: 記録なし（更新前の投稿は復元しません）',attemptText,'※投稿の確認と、Figma取得・案件実装の成功は別です。'].join('\n');
}
