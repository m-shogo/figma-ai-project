import assert from 'node:assert/strict';
import { decide } from '../common/mock-gate.mjs';
const base = {
  "enabled": true,
  "offline": false,
  "authRequired": false,
  "limit": false,
  "owner": true,
  "otherExecutorActive": false,
  "targetVerified": true,
  "figmaVerified": true,
  "unknownPreviousSend": false,
  "busy": false,
  "draftEmpty": true,
  "pendingAttachment": false,
  "due": true,
  "alreadyAttempted": false,
  "officialPathVerified": true
};
const cases = [
  [
    "ready",
    {},
    "MOCK_READY"
  ],
  [
    "disabled",
    {
      "enabled": false
    },
    "DISABLED"
  ],
  [
    "offline",
    {
      "offline": true
    },
    "OFFLINE"
  ],
  [
    "auth",
    {
      "authRequired": true
    },
    "AUTH_REQUIRED"
  ],
  [
    "limit",
    {
      "limit": true
    },
    "LIMIT"
  ],
  [
    "other executor",
    {
      "otherExecutorActive": true
    },
    "OWNER_UNCONFIRMED"
  ],
  [
    "wrong chat",
    {
      "targetVerified": false
    },
    "TARGET_UNCONFIRMED"
  ],
  [
    "send unknown",
    {
      "unknownPreviousSend": true
    },
    "RECONCILE_REQUIRED"
  ],
  [
    "busy",
    {
      "busy": true
    },
    "BUSY"
  ],
  [
    "human draft",
    {
      "draftEmpty": false
    },
    "DRAFT_OR_ATTACHMENT"
  ],
  [
    "attachment",
    {
      "pendingAttachment": true
    },
    "DRAFT_OR_ATTACHMENT"
  ],
  [
    "not due",
    {
      "due": false
    },
    "NOT_DUE_OR_DUPLICATE"
  ],
  [
    "duplicate",
    {
      "alreadyAttempted": true
    },
    "NOT_DUE_OR_DUPLICATE"
  ],
  [
    "path not verified",
    {
      "officialPathVerified": false
    },
    "PATH_UNVERIFIED"
  ]
];
let count=0;
for (const [name, patch, expected] of cases) {
  assert.equal(decide({...base,...patch}),expected,name);count++;
}
for (const key of Object.keys(base)) {
  for (const value of [null,'unknown',42]) {
    assert.notEqual(decide({...base,[key]:value}),'MOCK_READY',key);count++;
  }
  const copy={...base};delete copy[key];
  assert.notEqual(decide(copy),'MOCK_READY',key+' missing');count++;
}
console.log(count + ' mock decision cases passed');
