// Runs in an isolated extension world. Reads only controls and user-turn receipts.
// No fetch, cookies, tokens, private API, response-body collection or remote code.
export async function operate({url,connector,prompt,mode,attempt}) {
  const fail = reason => ({event:reason,phase:'PREFLIGHT',clickAttempted:false});
  const visible = el => !!el && el.getClientRects().length > 0;
  const controls = () => [...document.querySelectorAll('button')].filter(visible);
  // textContent concatenates sibling labels ("FigmaCreate..."). The visible
  // button has a line break between the name and description; use rendered text.
  const name = el => (el.getAttribute('aria-label') || el.innerText || el.textContent || '').replace(/\s+/g,' ').trim();
  const button = label => {
    const matches = controls().filter(el => name(el) === label);
    return matches.length === 1 ? matches[0] : null;
  };
  const composer = () => {
    const all = [...document.querySelectorAll('[role="textbox"][aria-label="Ask ChatGPT"][contenteditable="true"]')].filter(visible);
    return all.length === 1 ? all[0] : null;
  };
  const check = () => {
    if (location.href !== url) return 'WRONG_CHAT';
    if (!navigator.onLine) return 'OFFLINE';
    if (button('Stop')) return 'BUSY';
    if (button('Log in') || button('Sign in')) return 'AUTH_REQUIRED';
    const alerts = [...document.querySelectorAll('[role="alert"], [role="dialog"]')].filter(visible);
    if (alerts.some(el => /limit|上限|too many|try again later/i.test(el.textContent))) return 'LIMIT';
    if (alerts.length) return 'ALERT_OR_DIALOG';
    return composer() ? null : 'UI_UNRECOGNIZED';
  };
  const issue = check();
  if (issue) return fail(issue);
  const input = composer();
  if (input.textContent.trim() || input.querySelector('[app-mention-path],img')) return fail('DRAFT_EXISTS');
  // Unknown attachment controls are not guessed away. The composer must contain
  // no attachment remove buttons before we touch it.
  const region = input.closest('fieldset');
  const allowed = ['Add files and more','Select ChatGPT model','Dictate','Start Voice'];
  if (!region || [...region.querySelectorAll('button')].some(el => !allowed.includes(name(el)))) return fail('ATTACHMENT_OR_UNKNOWN');
  if (mode === 'probe') return {event:'IDLE_EMPTY'};
  if (mode !== 'send') return fail('MODE_INVALID');
  let interrupted = false;
  const intervene = e => { if (e.isTrusted) interrupted = true; };
  document.addEventListener('keydown',intervene,true);
  document.addEventListener('pointerdown',intervene,true);
  const wait = async predicate => {
    const deadline = Date.now()+8000;
    while (Date.now() < deadline) {
      if (interrupted || location.href !== url) throw Error('USER_OR_NAVIGATION');
      const result = predicate();
      if (result) return result;
      await new Promise(resolve => setTimeout(resolve,100));
    }
    throw Error('UI_TIMEOUT');
  };
  // Only read the user's posted message. Never traverse assistant response text.
  const receiptCount = () => [...document.querySelectorAll('.rich-text-user-turn')].filter(el =>
    el.textContent.replace(/\s+/g,' ').trim() === `Figma ${prompt}` &&
    [...el.querySelectorAll('a')].some(a => a.getAttribute('href') === '/plugins/plugin_'+connector.slice(6))).length;
  const before = receiptCount();
  let clicked = false;
  let phase = 'PREPARE_INPUT';
  try {
    input.focus();
    if (!document.execCommand('insertText',false,'@Figma')) throw Error('INPUT_UNSUPPORTED');
    if (input.textContent !== '@Figma') throw Error('INPUT_CHANGED');
    phase = 'SELECT_FIGMA';
    const candidate = await wait(() => button('Figma Create designs, ship to code'));
    candidate.click();
    await wait(() => input.querySelector('[app-mention-path]'));
    const mentions = input.querySelectorAll('[app-mention-path]');
    if (mentions.length !== 1 || mentions[0].getAttribute('app-mention-path') !== connector || mentions[0].getAttribute('contenteditable') !== 'false') throw Error('MENTION_UNVERIFIED');
    phase = 'ADD_PROMPT';
    input.focus();
    const selection = getSelection();
    const range = document.createRange(); range.selectNodeContents(input); range.collapse(false);
    selection.removeAllRanges(); selection.addRange(range);
    if (!document.execCommand('insertText',false,' '+prompt)) throw Error('INPUT_UNSUPPORTED');
    if (input.textContent.replace(/\s+/g,' ').trim() !== `Figma ${prompt}`) throw Error('INPUT_CHANGED');
    phase = 'FIND_SEND';
    const send = await wait(() => { const b=button('Send'); return b && !b.disabled && b; });
    if (interrupted || check() || composer() !== input || mentions[0].getAttribute('app-mention-path') !== connector) throw Error('PRE_SEND_CHANGED');
    const {state,cancelledAttempt} = await chrome.storage.local.get(['state','cancelledAttempt']);
    if (!attempt || cancelledAttempt===attempt || state?.pending !== attempt || state.reason !== 'ATTEMPTING') throw Error('CANCELLED');
    if (interrupted || check()) throw Error('PRE_SEND_CHANGED');
    phase = 'CLICK_SEND';
    clicked = true; send.click();
    phase = 'VERIFY_RECEIPT';
    await wait(() => receiptCount() === before+1 && composer()?.textContent.trim() === '');
    return {event:'CONFIRMED',figmaSelected:true,phase:'VERIFY_RECEIPT',clickAttempted:true};
  } catch(e) {
    // Keep partial draft for inspection. Never automatically clear/retry it.
    return {event:clicked ? 'RESULT_UNKNOWN' : String(e.message),phase,clickAttempted:clicked};
  } finally {
    document.removeEventListener('keydown',intervene,true);
    document.removeEventListener('pointerdown',intervene,true);
  }
}
