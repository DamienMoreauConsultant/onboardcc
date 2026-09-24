import { cn } from '@/lib/utils';

/**
 * Code couleur des états (Retour_30, 24/09/2026) — indique qui doit agir :
 *  - 'recruteur' : le recruteur a une action à faire (bleu)
 *  - 'autre'     : on attend une action du candidat ou du CM (ambre) — sert aux relances
 *  - 'aucune'    : état final, rien n'est attendu (neutre)
 */
export type ActionCote = 'recruteur' | 'autre' | 'aucune';

/** Côté de l'action attendue pour un état d'opportunité (cycle de vie de l'opportunité). */
export function opportuniteActionCote(etat: string): ActionCote {
  switch (etat) {
    case 'Non qualifié':
    case 'Approuvé CM':
    case 'Accepté':
      return 'recruteur';
    case 'Proposée au CM':
    case 'Mise en lien':
    case 'Accord de principe':
      return 'autre';
    default:
      return 'aucune';
  }
}

const STYLES: Record<ActionCote, string> = {
  recruteur: 'border-primary/40 bg-primary/10 text-primary',
  autre: 'border-amber-400 bg-amber-100 text-amber-900',
  aucune: 'border-border bg-background text-foreground',
};

type Props = {
  /** Libellé ; un séparateur " — " le découpe en 2 lignes (titre / précision). */
  label: string;
  cote: ActionCote;
  /** États négatifs finaux (rejet, refus) : garde le rouge existant. */
  destructive?: boolean;
  className?: string;
};

export function EtatBadge({ label, cote, destructive, className }: Props) {
  const [title, detail] = label.split(' — ');
  return (
    <span
      className={cn(
        'inline-flex flex-col rounded-md border px-2.5 py-1 text-xs leading-tight',
        destructive ? 'border-destructive bg-destructive text-destructive-foreground' : STYLES[cote],
        className,
      )}
    >
      <span className="font-semibold">{title}</span>
      {detail && <span className="font-normal opacity-90">{detail}</span>}
    </span>
  );
}

/** Légende du code couleur, à placer au-dessus d'une liste. */
export function EtatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-primary/40 bg-primary/10" />Action du recruteur</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-amber-400 bg-amber-100" />En attente du candidat ou du CM</span>
    </div>
  );
}
