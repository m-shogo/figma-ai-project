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
    "owner unknown",
    {},
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
    "figma unknown",
    {},
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
    "busy unknown",
    {},
    "UNKNOWN"
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
for (const [name, patch, expected] of cases) {
  // JSON serialisation omits undefined; explicitly reproduce the unknown states.
  if (name === 'owner unknown') patch.owner = undefined;
  if (name === 'figma unknown') patch.figmaVerified = undefined;
  if (name === 'busy unknown') patch.busy = undefined;
  assert.equal(decide({...base,...patch}),expected,name);
}
console.log(cases.length + ' mock decision cases passed');
