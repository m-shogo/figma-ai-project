// Pure simulation only. No network, DOM, service access, or message sending.
export function decide(s) {
  if (!s || s.enabled !== true) return "DISABLED";
  if (s.offline === true) return "OFFLINE";
  if (s.authRequired === true) return "AUTH_REQUIRED";
  if (s.limit === true) return "LIMIT";
  if (s.owner !== true || s.otherExecutorActive !== false) return "OWNER_UNCONFIRMED";
  if (s.targetVerified !== true || s.figmaVerified !== true) return "TARGET_UNCONFIRMED";
  if (s.unknownPreviousSend !== false) return "RECONCILE_REQUIRED";
  if (s.busy !== false) return s.busy === true ? "BUSY" : "UNKNOWN";
  if (s.draftEmpty !== true || s.pendingAttachment !== false) return "DRAFT_OR_ATTACHMENT";
  if (s.due !== true || s.alreadyAttempted !== false) return "NOT_DUE_OR_DUPLICATE";
  if (s.officialPathVerified !== true) return "PATH_UNVERIFIED";
  return "MOCK_READY";
}
