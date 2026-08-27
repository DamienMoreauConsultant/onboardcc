/** Strict CRM date contract: JJ/MM/AAAA, including calendar validation. */
export function parseFrenchDate(value: string | undefined | null): { iso: string | null; valid: boolean } {
  const raw = value?.trim() ?? '';
  if (!raw) return { iso: null, valid: true };
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (!match) return { iso: null, valid: false };
  const [, dd, mm, yyyy] = match;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  if (date.getUTCFullYear() !== Number(yyyy) || date.getUTCMonth() !== Number(mm) - 1 || date.getUTCDate() !== Number(dd)) {
    return { iso: null, valid: false };
  }
  return { iso: `${yyyy}-${mm}-${dd}`, valid: true };
}

/** Convert an optional date submitted by a form into a SQL-safe value. */
export function nullableDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return String(value);
}