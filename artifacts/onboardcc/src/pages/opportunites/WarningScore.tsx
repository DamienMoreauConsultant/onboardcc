import { CircleCheck, OctagonAlert, TriangleAlert } from 'lucide-react';

type Props = {
  value: number | string | null;
  className?: string;
};

export function WarningScore({ value, className = '' }: Props) {
  if (value === null || value === undefined || value === '') {
    return <span className={className}>—</span>;
  }

  const score = Number(value);
  if (score === 0) {
    return <CircleCheck className={`h-6 w-6 text-emerald-600 ${className}`} aria-label="Alerte : OK" />;
  }
  if (score === 5) {
    return <TriangleAlert className={`h-6 w-6 text-amber-500 ${className}`} aria-label="Alerte : Attention" />;
  }
  return <OctagonAlert className={`h-6 w-6 text-red-600 ${className}`} aria-label="Alerte : Danger" />;
}