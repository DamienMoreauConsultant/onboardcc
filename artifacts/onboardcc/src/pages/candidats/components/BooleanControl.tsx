import React from 'react';
import { CheckCircle2, CircleHelp, XCircle } from 'lucide-react';

type Props = {
  value: boolean | undefined | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function BooleanControl({ value, onChange, disabled }: Props) {
  const normalized = value === true ? true : value === false ? false : null;

  if (disabled) {
    return (
      <span className="inline-flex items-center gap-2 text-sm" title={normalized === null ? 'Non renseigné' : normalized ? 'Oui' : 'Non'}>
        {normalized === true && <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />}
        {normalized === false && <XCircle className="h-6 w-6 text-destructive" aria-hidden="true" />}
        {normalized === null && <CircleHelp className="h-6 w-6 text-muted-foreground" aria-hidden="true" />}
        {normalized === null && <span className="text-xs text-muted-foreground">Non renseigné</span>}
        <span className="sr-only">{normalized === null ? 'Non renseigné' : normalized ? 'Oui' : 'Non'}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Oui"
        title="Oui"
        onClick={() => onChange(true)}
        className={`rounded-full p-1 transition hover:bg-emerald-50 ${normalized === true ? 'bg-emerald-100' : 'opacity-45 hover:opacity-100'}`}
      >
        <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Non"
        title="Non"
        onClick={() => onChange(false)}
        className={`rounded-full p-1 transition hover:bg-red-50 ${normalized === false ? 'bg-red-100' : 'opacity-45 hover:opacity-100'}`}
      >
        <XCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
      </button>
      {normalized === null && <span className="ml-1 text-xs font-medium text-muted-foreground">Non renseigné</span>}
    </div>
  );
}
