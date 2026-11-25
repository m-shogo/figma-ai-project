import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlist} from '../mac/launchagent.mjs';
const opt={node:'/opt/node',script:'/tmp/a&b <c>/runner.mjs',dir:'/tmp/Mac Helper',minute:5};
test('hourly agent runs only offline mock and escapes paths',()=>{const s=makePlist(opt);assert.match(s,/<string>tick-mock<\/string>/);assert.match(s,/<key>Minute<\/key><integer>5<\/integer>/);assert.match(s,/<key>RunAtLoad<\/key><false\/>/);assert.match(s,/a&amp;b &lt;c&gt;/);assert.match(s,/\/tmp\/Mac Helper/);assert.doesNotMatch(s,/chatgpt\.com|https?:\/\/.*chatgpt/);});
test('invalid clock and path rejected',()=>{for(const patch of [{minute:-1},{minute:60},{minute:5.5},{dir:'relative'},{node:'/tmp/\nnode'}])assert.throws(()=>makePlist({...opt,...patch}));});
