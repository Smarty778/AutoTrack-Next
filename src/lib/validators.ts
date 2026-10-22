export const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;
export const BCRYPT_ROUNDS = 10;

export const str = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : '';

export const optionalStr = (v: unknown): string | null => {
  const s = str(v);
  return s ? s : null;
};

// Login lowercases the identifier, so usernames/emails MUST be stored lowercase.
export const normalizeIdentity = (v: unknown): string => str(v).toLowerCase();