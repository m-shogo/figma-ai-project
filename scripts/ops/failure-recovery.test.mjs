import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyFailure, failureFingerprint, decideRecovery} from './failure-recovery.mjs';

test('Resource not found is a lookup failure, not evidence that Figma is disconnected', () => {
  assert.equal(classifyFailure('Resource not found'), 'RESOURCE_LOOKUP');
});
test('fingerprint ignores ephemeral session IDs', () => {
  const base = {tool:'skills__read',operation:'load',target:'figma-design-to-code'};
  assert.equal(failureFingerprint({...base,error:'Resource not found 123e4567-e89b-12d3-a456-426614174000'}),failureFingerprint({...base,error:'Resource not found 223e4567-e89b-12d3-a456-426614174001'}));
});
test('repeat without changed prerequisite does not retry and requests review', () => {
  const current = {tool:'skills__read',operation:'load',target:'figma-design-to-code',error:'Resource not found'};
  const previous = {fingerprint:failureFingerprint(current),consecutiveCount:1};
  const result = decideRecovery({current,previous,independentReady:true});
  assert.equal(result.retrySameCall,false);
  assert.equal(result.processReviewRequired,true);
  assert.equal(result.action,'SWITCH_IN_PHASE_READY');
});
test('no independent READY means explicit BLOCKED', () => {
  const current = {tool:'skills__read',operation:'load',target:'figma-design-to-code',error:'Resource not found'};
  assert.equal(decideRecovery({current,previous:{fingerprint:failureFingerprint(current),consecutiveCount:2}}).action,'BLOCK_WITH_UNBLOCK_CONDITION');
});
test('changed prerequisite allows a fresh recovery attempt', () => {
  const current = {tool:'skills__read',operation:'load',target:'figma-design-to-code',error:'Resource not found'};
  assert.equal(decideRecovery({current,previous:{fingerprint:failureFingerprint(current)},changedPrerequisite:true}).retrySameCall,true);
});
test('design context is blocked without required skill', () => {
  const current = {tool:'mcp__Figma',operation:'get_design_context',target:'221:335',error:'Resource not found'};
  const result=decideRecovery({current,mandatorySkillLoaded:false});
  assert.equal(result.action,'BLOCK_UNTIL_SKILL_LOADED');
  assert.equal(result.retrySameCall,false);
});
test('incomplete evidence is rejected', () => {
  assert.throws(()=>decideRecovery({current:{error:'Resource not found'}}),/complete failure evidence/);
});
