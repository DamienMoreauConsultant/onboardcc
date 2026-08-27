import React from 'react';
import { CircleCheckBig, CircleHelp, Clock3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  kind: 'qualify' | 'approved' | 'assignment';
  scope: 'candidat' | 'poste';
};

export function KpiHeader({ kind, scope }: Props) {
  const descriptions = {
    qualify: `Nombre d'opportunités de ce ${scope} à l'état Non qualifié ou Proposée au CM`,
    approved: `Nombre d'opportunités de ce ${scope} à l'état Approuvé CM`,
    assignment: `Nombre d'opportunités de ce ${scope} aux états Mise en lien, Accord de principe, Accepté ou Affecté`,
  };
  const icons = {
    qualify: CircleHelp,
    approved: CircleCheckBig,
    assignment: Clock3,
  };
  const Icon = icons[kind];
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help items-center justify-center" aria-label={descriptions[kind]}>
            <Icon className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-72 normal-case" side="bottom">{descriptions[kind]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}