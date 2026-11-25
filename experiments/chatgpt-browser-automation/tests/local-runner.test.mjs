import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {init,runMock,fixtureFlags} from '../common/local-runner.mjs';
const H=3600000;
const cli=fileURLToPath(new URL('../common/local-runner.mjs',import.meta.url));
function temp(t){const p=fs.mkdtempSync(path.join(os.tmpdir(),'jwsnj-offline-'));t.after(()=>fs.rmSync(p,{recursive:true,force:true}));return p;}
function invoke(mode,dir){const p=spawnSync(process.execPath,[cli,mode,dir],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);return JSON.parse(p.stdout).event;}
test('real subprocesses share persisted state and refuse duplicate hourly invocation',t=>{const d=temp(t);assert.equal(invoke('init-mock',d),'INITIALIZED');assert.equal(invoke('tick-mock',d),'MOCK_CONFIRMED');assert.equal(invoke('tick-mock',d),'NOT_DUE_OR_DUPLICATE');assert.equal(invoke('init-mock',d),'ALREADY_INITIALIZED');});
test('24 hourly slots persist and skip duplicates after every invocation',t=>{const d=temp(t);init(d);for(let i=0;i<24;i++){assert.equal(runMock(d,(100+i)*H).event,'MOCK_CONFIRMED');assert.equal(runMock(d,(100+i)*H).event,'NOT_DUE_OR_DUPLICATE');}assert.equal(runMock(d,90*H).event,'NOT_DUE_OR_DUPLICATE');});
test('unknown result survives restart and cannot be resent',t=>{const d=temp(t);init(d);assert.equal(runMock(d,10*H,fixtureFlags,'unknown').event,'RECONCILE_REQUIRED');assert.equal(runMock(d,11*H).event,'RECONCILE_REQUIRED');assert.equal(JSON.parse(fs.readFileSync(path.join(d,'mock-state.json'))).pending,10);});
test('lock held by another process fails closed',t=>{const d=temp(t);init(d);fs.mkdirSync(path.join(d,'mock-run.lock'));assert.equal(invoke('tick-mock',d),'LOCKED');assert.equal(JSON.parse(fs.readFileSync(path.join(d,'mock-state.json'))).lastSlot,null);});
test('corrupt state is not silently recreated',t=>{const d=temp(t);init(d);const f=path.join(d,'mock-state.json');fs.writeFileSync(f,'{');assert.equal(runMock(d,10*H).event,'STATE_UNREADABLE');assert.equal(fs.readFileSync(f,'utf8'),'{');});
test('busy skips one slot and next invocation can resume',t=>{const d=temp(t);init(d);assert.equal(runMock(d,10*H,{...fixtureFlags,busy:true}).event,'BUSY');assert.equal(runMock(d,10*H+500).event,'NOT_DUE_OR_DUPLICATE');assert.equal(runMock(d,11*H).event,'MOCK_CONFIRMED');});
test('unverified path cannot send; stop persists',t=>{const d=temp(t);init(d);assert.equal(runMock(d,10*H,{...fixtureFlags,officialPathVerified:false}).event,'PATH_UNVERIFIED');assert.equal(runMock(d,11*H).event,'RECONCILE_REQUIRED');});
