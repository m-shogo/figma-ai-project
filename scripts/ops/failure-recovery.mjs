// Deterministic incident classification and retry policy; no network calls or side effects.
import { createHash } from 'node:crypto';

export const ERROR_CLASSES = Object.freeze(['AUTH_PERMISSION','RESOURCE_LOOKUP','TRANSIENT','RATE_LIMIT','BAD_INPUT','ENV_UNAVAILABLE','CODE_REGRESSION','UNKNOWN']);

export function classifyFailure(message = '') {
  const m = String(message).toLowerCase();
  if (/401|403|unauthori[sz]ed|permission denied|access denied|forbidden/.test(m)) return 'AUTH_PERMISSION';
  if (/429|rate.limit|too many requests/.test(m)) return 'RATE_LIMIT';
  if (/timeout|timed out|temporar|503|502|connection reset/.test(m)) return 'TRANSIENT';
  if (/resource not found|not_found|404|does not exist|not found/.test(m)) return 'RESOURCE_LOOKUP';
  if (/invalid argument|bad input|validation failed|malformed|422/.test(m)) return 'BAD_INPUT';
  if (/environment unavailable|runtime unavailable|not installed|executable not found/.test(m)) return 'ENV_UNAVAILABLE';
  if (/assertion failed|test failed|regression/.test(m)) return 'CODE_REGRESSION';
  return 'UNKNOWN';
}

export function normalizeError(message = '') {
  return String(message).toLowerCase()
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/g, '<session>')
    .replace(/\b[0-9a-f]{40}\b/g, '<sha>')
    .replace(/\b\d{4}-\d\d-\d\dt\d\d:\d\d:\d\d(?:\.\d+)?z\b/g, '<time>')
    .replace(/\s+/g, ' ').trim().slice(0, 400);
}

export function failureFingerprint({tool, operation, target, error}) {
  for (const field of [tool, operation, target]) if (!String(field ?? '').trim()) throw new Error('tool, operation and target are required');
  return createHash('sha256').update(JSON.stringify([tool, operation, target, normalizeError(error)])).digest('hex').slice(0, 20);
}

export function decideRecovery({current, previous, changedPrerequisite = false, independentReady = false, mandatorySkillLoaded = false}) {
  if (!current?.tool || !current?.operation || !current?.target || !current?.error) throw new Error('complete failure evidence required');
  const fingerprint = failureFingerprint(current);
  const repeated = previous?.fingerprint === fingerprint && !changedPrerequisite;
  const reviewRequired = repeated && Number(previous?.consecutiveCount ?? 1) >= 1;
  const skillBlocked = current.operation === 'get_design_context' && !mandatorySkillLoaded;
  return {
    fingerprint,
    errorClass: classifyFailure(current.error),
    consecutiveCount: repeated ? Number(previous?.consecutiveCount ?? 1) + 1 : 1,
    retrySameCall: !repeated && !skillBlocked,
    processReviewRequired: reviewRequired,
    action: skillBlocked ? 'BLOCK_UNTIL_SKILL_LOADED' : repeated ? (independentReady ? 'SWITCH_IN_PHASE_READY' : 'BLOCK_WITH_UNBLOCK_CONDITION') : 'CLASSIFY_AND_RECOVER',
    verified: false
  };
}
