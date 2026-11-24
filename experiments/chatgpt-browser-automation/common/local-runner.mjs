// Offline runtime only: no browser, account, network, credentials or live sender.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { initialState, tick, settle } from './mock-recurring.mjs';

const FILE = 'mock-state.json';
export const fixtureFlags = Object.freeze({enabled:true,offline:false,authRequired:false,limit:false,owner:true,otherExecutorActive:false,targetVerified:true,figmaVerified:true,unknownPreviousSend:false,busy:false,draftEmpty:true,pendingAttachment:false,due:true,alreadyAttempted:false,officialPathVerified:true});
function withLock(dir, fn) {
  const lock = path.join(dir, 'mock-run.lock');
  try { fs.mkdirSync(lock, { mode: 0o700 }); }
  catch (e) { if (e.code === 'EEXIST') return {event:'LOCKED'}; throw e; }
  try { return fn(); }
  finally { fs.rmdirSync(lock); }
}
function atomicSave(dir, state) {
  const temp = path.join(dir, `.mock-state-${randomUUID()}.tmp`);
  let fd;
  try {
    fd = fs.openSync(temp, 'wx', 0o600);
    fs.writeFileSync(fd, JSON.stringify(state) + '\n');
    fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
    fs.renameSync(temp, path.join(dir, FILE));
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    fs.rmSync(temp, {force:true});
  }
}
function readState(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, FILE), 'utf8'));
}
export function init(dir) {
  fs.mkdirSync(dir,{recursive:true,mode:0o700});
  return withLock(dir, () => {
    if (fs.existsSync(path.join(dir, FILE))) return {event:'ALREADY_INITIALIZED'};
    atomicSave(dir, initialState()); return {event:'INITIALIZED'};
  });
}
export function runMock(dir, now = Date.now(), flags = fixtureFlags, outcome = 'mock_confirmed') {
  return withLock(dir, () => {
    let before;
    try { before = readState(dir); } catch { return {event:'STATE_UNREADABLE'}; }
    const next = tick(before, now, flags);
    if (next.event === 'INVALID_STATE') return {event:next.event};
    if (next.state !== before) atomicSave(dir, next.state);
    if (next.event !== 'MOCK_ATTEMPT') return {event:next.event};
    // The pending record is persisted BEFORE the simulated action. Never retry an unknown result.
    const receipt = settle(next.state, next.state.pending, outcome);
    atomicSave(dir, receipt.state);
    return {event:receipt.event,slot:next.state.pending};
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [mode, dir, ...extra] = process.argv.slice(2);
  if (!dir || extra.length || !['init-mock','tick-mock'].includes(mode)) {
    console.error('Usage: node local-runner.mjs init-mock|tick-mock ABSOLUTE_MOCK_STATE_DIR');
    process.exitCode=2;
  } else if (!path.isAbsolute(dir)) {
    console.error('Absolute state directory required'); process.exitCode=2;
  } else {
    try { const result = mode==='init-mock' ? init(dir) : runMock(dir); console.log(JSON.stringify(result)); }
    catch(e) { console.error('STOP:', e.code ?? 'RUNTIME_ERROR'); process.exitCode=1; }
  }
}
