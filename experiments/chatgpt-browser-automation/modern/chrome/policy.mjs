export const CONNECTOR = 'app://connector_68df038e0ba48191908c8434991bbac2';
export function validateConfig(c) {
  if (!c || c.version !== 1) throw Error('CONFIG_INVALID');
  const u = new URL(c.url);
  if (u.origin !== 'https://chatgpt.com' || !/^\/c\/[0-9a-f-]{36}$/.test(u.pathname) || u.search || u.hash || u.username || u.password) throw Error('TARGET_INVALID');
  if (c.connector !== CONNECTOR || c.prompt !== '慎重に進んで') throw Error('PROMPT_INVALID');
  if (!Number.isInteger(c.intervalMinutes) || c.intervalMinutes < 60 || c.intervalMinutes > 10080) throw Error('INTERVAL_INVALID');
  if (c.owner !== 'this-mac' || typeof c.exclusiveOwnerConfirmed !== 'boolean') throw Error('OWNER_INVALID');
  return c;
}
export function initialState() {
  return {version:1, enabled:false, pending:null, nextDue:null, lastAttempt:null, lastOutputAt:null, sent:0, skipped:0, reason:'NOT_STARTED'};
}
export function validState(s) {
  return !!s && s.version === 1 && typeof s.enabled === 'boolean' &&
    [s.nextDue,s.lastAttempt,s.lastOutputAt].every(v => v === null || Number.isSafeInteger(v) && v >= 0) &&
    (s.pending === null || typeof s.pending === 'string' && s.pending.length > 0) &&
    [s.sent,s.skipped].every(v => Number.isSafeInteger(v) && v >= 0) && typeof s.reason === 'string';
}
export function gate(c, s, now, manual) {
  validateConfig(c);
  if (!validState(s)) return 'STATE_INVALID';
  if (s.pending) return 'RESULT_UNKNOWN';
  if (!manual && !s.enabled) return 'DISABLED';
  if (!c.exclusiveOwnerConfirmed) return 'OWNER_UNCONFIRMED';
  if (s.lastAttempt !== null && now < s.lastAttempt) return 'CLOCK_ROLLBACK';
  // Manual run never bypasses the cooldown, including after an uncertain result.
  if (s.nextDue !== null && now < s.nextDue) return 'NOT_DUE';
  return 'READY';
}
