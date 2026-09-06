const MIN_SECRET_LENGTH = 32;
const DEFAULT_EXPIRE_HOURS = 8;
const MAX_EXPIRE_HOURS = 24;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error('JWT_SECRET ou SESSION_SECRET doit contenir au moins 32 caractères.');
  }
  return secret;
}

export function getJwtExpireHours(): number {
  const raw = process.env.JWT_EXPIRE_HOURS ?? String(DEFAULT_EXPIRE_HOURS);
  if (!/^\d+$/.test(raw)) throw new Error('JWT_EXPIRE_HOURS doit être un entier positif.');
  const hours = Number(raw);
  if (hours < 1 || hours > MAX_EXPIRE_HOURS) {
    throw new Error(`JWT_EXPIRE_HOURS doit être compris entre 1 et ${MAX_EXPIRE_HOURS}.`);
  }
  return hours;
}