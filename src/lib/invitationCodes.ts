import { UserRole } from '@/hooks/useUserProfile';

export type InviteRole = 'Professor' | 'Librarian' | 'Canteen Staff';

export interface InvitationCode {
  code: string;
  role: InviteRole;
  usedBy: string | null;
  createdAt: string;
  createdBy?: string;
}

const STORAGE_KEY = 'campus_invitation_codes';

/** Valid format: PROF-XXXX, LIBR-XXXX, CANT-XXXX (admin-generated) */
const CODE_PATTERN = /^(PROF|LIBR|CANT)-[A-Z0-9]{4}$/;

const REMOVED_DEMO_CODES = ['PROF-2024', 'LIBR-2024', 'CANT-2024'];

function getCodes(): InvitationCode[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const codes: InvitationCode[] = JSON.parse(stored);
    const filtered = codes.filter(c => !REMOVED_DEMO_CODES.includes(c.code.toUpperCase()));
    if (filtered.length !== codes.length) {
      saveCodes(filtered);
    }
    return filtered;
  } catch {
    return [];
  }
}

function saveCodes(codes: InvitationCode[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}

export function isValidCodeFormat(code: string): boolean {
  return CODE_PATTERN.test(code.trim().toUpperCase());
}

export function lookupInviteCode(code: string): InvitationCode | null {
  const normalized = code.trim().toUpperCase();
  if (!isValidCodeFormat(normalized)) return null;
  return getCodes().find(c => c.code.toUpperCase() === normalized) || null;
}

export type InviteValidationResult =
  | { valid: true; entry: InvitationCode }
  | { valid: false; reason: 'invalid_format' | 'not_found' | 'already_used' | 'wrong_role' };

export function validateInviteCodeDetailed(code: string, role: InviteRole): InviteValidationResult {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return { valid: false, reason: 'invalid_format' };
  }

  if (!isValidCodeFormat(normalized)) {
    return { valid: false, reason: 'invalid_format' };
  }

  const entry = lookupInviteCode(normalized);
  if (!entry) {
    return { valid: false, reason: 'not_found' };
  }

  if (entry.usedBy) {
    return { valid: false, reason: 'already_used' };
  }

  if (entry.role !== role) {
    return { valid: false, reason: 'wrong_role' };
  }

  return { valid: true, entry };
}

export function validateInviteCode(code: string, role: InviteRole): boolean {
  return validateInviteCodeDetailed(code, role).valid;
}

export function getInviteCodeErrorMessage(result: InviteValidationResult): string {
  switch (result.reason) {
    case 'invalid_format':
      return 'Invalid invitation code format. Codes must be issued by an administrator (e.g. PROF-A1B2).';
    case 'not_found':
      return 'This invitation code does not exist. Please contact your administrator for a valid code.';
    case 'already_used':
      return 'This invitation code has already been used.';
    case 'wrong_role':
      return 'This invitation code is not valid for the selected role.';
    default:
      return 'Invalid invitation code.';
  }
}

export function generateInviteCode(role: InviteRole, createdBy?: string): InvitationCode {
  const prefix = role === 'Professor' ? 'PROF' : role === 'Librarian' ? 'LIBR' : 'CANT';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `${prefix}-${suffix}`;

  const entry: InvitationCode = {
    code,
    role,
    usedBy: null,
    createdAt: new Date().toISOString(),
    createdBy,
  };

  const codes = getCodes();
  codes.push(entry);
  saveCodes(codes);
  return entry;
}

export function markCodeUsed(code: string, userId: string) {
  const codes = getCodes();
  const idx = codes.findIndex(c => c.code.toUpperCase() === code.trim().toUpperCase());
  if (idx >= 0) {
    codes[idx].usedBy = userId;
    saveCodes(codes);
  }
}

export function getAllCodes(): InvitationCode[] {
  return getCodes();
}

export function deleteCode(code: string) {
  const codes = getCodes().filter(c => c.code.toUpperCase() !== code.trim().toUpperCase());
  saveCodes(codes);
}

export function isStaffRole(role: UserRole): role is InviteRole {
  return role === 'Professor' || role === 'Librarian' || role === 'Canteen Staff';
}
