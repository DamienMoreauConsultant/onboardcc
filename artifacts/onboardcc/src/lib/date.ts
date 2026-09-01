/**
 * Formats API/database dates for display without applying timezone conversion.
 * PostgreSQL DATE values arrive as YYYY-MM-DD strings.
 */
export function formatDateFR(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '—';
    const day = String(value.getUTCDate()).padStart(2, '0');
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${value.getUTCFullYear()}`;
  }

  const text = String(value).trim();
  if (!text) return '—';

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const frenchMatch = text.match(/^(\d{2})[/-](\d{2})[/-](\d{4})(?:$|T|\s)/);
  if (frenchMatch) return `${frenchMatch[1]}/${frenchMatch[2]}/${frenchMatch[3]}`;

  return text.split('T')[0] || '—';
}