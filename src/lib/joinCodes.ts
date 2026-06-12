const GROUP_CODES_KEY = 'campus_group_join_codes';
const FORUM_CODES_KEY = 'campus_forum_join_codes';
const RESOURCE_CODES_KEY = 'campus_resource_join_codes';
const GROUP_MEMBERSHIPS_KEY = 'campus_group_memberships';
const FORUM_MEMBERSHIPS_KEY = 'campus_forum_memberships';
const RESOURCE_ACCESS_KEY = 'campus_resource_access';

interface CodeEntry {
  code: string;
  resourceId: string;
  name: string;
  createdAt: string;
}

interface Membership {
  userId: string;
  resourceId: string;
  fullName: string;
  joinedAt: string;
}

function getCodes(key: string): CodeEntry[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveCodes(key: string, codes: CodeEntry[]) {
  localStorage.setItem(key, JSON.stringify(codes));
}

function getMemberships(key: string): Membership[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveMemberships(key: string, memberships: Membership[]) {
  localStorage.setItem(key, JSON.stringify(memberships));
}

export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function saveGroupCode(groupId: string, code: string, name: string) {
  const codes = getCodes(GROUP_CODES_KEY).filter(c => c.resourceId !== groupId);
  codes.push({ code: code.toUpperCase(), resourceId: groupId, name, createdAt: new Date().toISOString() });
  saveCodes(GROUP_CODES_KEY, codes);
}

export function saveForumCode(forumId: string, code: string, name: string) {
  const codes = getCodes(FORUM_CODES_KEY).filter(c => c.resourceId !== forumId);
  codes.push({ code: code.toUpperCase(), resourceId: forumId, name, createdAt: new Date().toISOString() });
  saveCodes(FORUM_CODES_KEY, codes);
}

export function saveResourceCode(resourceId: string, code: string, name: string) {
  const codes = getCodes(RESOURCE_CODES_KEY).filter(c => c.resourceId !== resourceId);
  codes.push({ code: code.toUpperCase(), resourceId, name, createdAt: new Date().toISOString() });
  saveCodes(RESOURCE_CODES_KEY, codes);
}

export function getGroupByCode(code: string): CodeEntry | null {
  const normalized = code.trim().toUpperCase();
  return getCodes(GROUP_CODES_KEY).find(c => c.code === normalized) || null;
}

export function getForumByCode(code: string): CodeEntry | null {
  const normalized = code.trim().toUpperCase();
  return getCodes(FORUM_CODES_KEY).find(c => c.code === normalized) || null;
}

export function getResourceByCode(code: string): CodeEntry | null {
  const normalized = code.trim().toUpperCase();
  return getCodes(RESOURCE_CODES_KEY).find(c => c.code === normalized) || null;
}

export function validateGroupCode(code: string): boolean {
  return getGroupByCode(code) !== null;
}

export function validateForumCode(code: string): boolean {
  return getForumByCode(code) !== null;
}

export function validateResourceCode(code: string): boolean {
  return getResourceByCode(code) !== null;
}

export function getGroupCode(groupId: string): string | null {
  const entry = getCodes(GROUP_CODES_KEY).find(c => c.resourceId === groupId);
  return entry?.code || null;
}

export function getForumCode(forumId: string): string | null {
  const entry = getCodes(FORUM_CODES_KEY).find(c => c.resourceId === forumId);
  return entry?.code || null;
}

export function getResourceCode(resourceId: string): string | null {
  const entry = getCodes(RESOURCE_CODES_KEY).find(c => c.resourceId === resourceId);
  return entry?.code || null;
}

export function getUserResourceAccess(userId: string): string[] {
  return getMemberships(RESOURCE_ACCESS_KEY)
    .filter(m => m.userId === userId)
    .map(m => m.resourceId);
}

export function hasResourceAccess(userId: string, resourceId: string): boolean {
  return getMemberships(RESOURCE_ACCESS_KEY).some(
    m => m.userId === userId && m.resourceId === resourceId
  );
}

export function grantResourceAccess(userId: string, resourceId: string, fullName: string) {
  if (hasResourceAccess(userId, resourceId)) return;
  const memberships = getMemberships(RESOURCE_ACCESS_KEY);
  memberships.push({ userId, resourceId, fullName, joinedAt: new Date().toISOString() });
  saveMemberships(RESOURCE_ACCESS_KEY, memberships);
}

export function joinResourceByCode(code: string, userId: string, fullName: string): CodeEntry {
  const entry = getResourceByCode(code);
  if (!entry) throw new Error('Invalid resource access code');
  if (hasResourceAccess(userId, entry.resourceId)) throw new Error('You already have access to this resource');

  grantResourceAccess(userId, entry.resourceId, fullName);
  return entry;
}

export function isGroupMember(userId: string, groupId: string): boolean {
  return getMemberships(GROUP_MEMBERSHIPS_KEY).some(
    m => m.userId === userId && m.resourceId === groupId
  );
}

export function isForumMember(userId: string, forumId: string): boolean {
  return getMemberships(FORUM_MEMBERSHIPS_KEY).some(
    m => m.userId === userId && m.resourceId === forumId
  );
}

export function getUserGroupMemberships(userId: string): string[] {
  return getMemberships(GROUP_MEMBERSHIPS_KEY)
    .filter(m => m.userId === userId)
    .map(m => m.resourceId);
}

export function getUserForumMemberships(userId: string): string[] {
  return getMemberships(FORUM_MEMBERSHIPS_KEY)
    .filter(m => m.userId === userId)
    .map(m => m.resourceId);
}

export function joinGroupByCode(code: string, userId: string, fullName: string): CodeEntry {
  const entry = getGroupByCode(code);
  if (!entry) throw new Error('Invalid group join code');
  if (isGroupMember(userId, entry.resourceId)) throw new Error('You are already a member of this group');

  const memberships = getMemberships(GROUP_MEMBERSHIPS_KEY);
  memberships.push({
    userId,
    resourceId: entry.resourceId,
    fullName,
    joinedAt: new Date().toISOString(),
  });
  saveMemberships(GROUP_MEMBERSHIPS_KEY, memberships);
  return entry;
}

export function joinForumByCode(code: string, userId: string, fullName: string): CodeEntry {
  const entry = getForumByCode(code);
  if (!entry) throw new Error('Invalid forum join code');
  if (isForumMember(userId, entry.resourceId)) throw new Error('You are already a member of this forum');

  const memberships = getMemberships(FORUM_MEMBERSHIPS_KEY);
  memberships.push({
    userId,
    resourceId: entry.resourceId,
    fullName,
    joinedAt: new Date().toISOString(),
  });
  saveMemberships(FORUM_MEMBERSHIPS_KEY, memberships);
  return entry;
}

export function addGroupMembership(userId: string, groupId: string, fullName: string) {
  if (isGroupMember(userId, groupId)) return;
  const memberships = getMemberships(GROUP_MEMBERSHIPS_KEY);
  memberships.push({ userId, resourceId: groupId, fullName, joinedAt: new Date().toISOString() });
  saveMemberships(GROUP_MEMBERSHIPS_KEY, memberships);
}
