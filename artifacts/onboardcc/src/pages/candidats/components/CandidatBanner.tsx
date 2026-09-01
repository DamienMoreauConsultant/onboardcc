import React, { useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check, Loader2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CandidatDetail, VoeuxReferences } from '@/api/candidats';
import { formatDateFR } from '@/lib/date';

type Props = {
  detail: CandidatDetail;
  mode: 'recruteur' | 'candidat';
  busy: boolean;
  reviewDate: string;
  setReviewDate: (date: string) => void;
  onReviseReview: () => void;
  onSave: (section: 'voeux', values: Record<string, unknown>) => void;
  onAction: (action: string) => void;
  onEditVoeux: () => void;
  onSubmit: (definitive: boolean) => void;
  refs?: VoeuxReferences;
};

const readStr = (value: unknown, key: string, refs?: VoeuxReferences) => {
  if (!value || !Array.isArray(value)) return '—';
  if (refs) {
    if (['domaines_formation', 'domaines_experience'].includes(key)) {
      return value.map((item: any) => refs.domaines.find((ref) => ref.id === (item.id ?? item.id_domaine))?.label).filter(Boolean).join(', ') || '—';
    }
    if (key === 'regions') {
      return value.map((item: any) => refs.regions.find((ref) => ref.id === (item.id_region ?? item.region?.id_region))?.label).filter(Boolean).join(', ') || '—';
    }
    if (key === 'durees') {
      return value.map((item: any) => refs.durees.find((ref) => ref.id === (item.id ?? item.id_duree))?.label).filter(Boolean).join(', ') || '—';
    }
  }
  return value.map((item) => typeof item === 'object' && item !== null ? (item.designation ?? item.periode ?? item.type_stage ?? item.crm_key ?? '—') : String(item)).join(', ') || '—';
};

export function CandidatBanner({ detail, mode, busy, reviewDate, setReviewDate, onReviseReview, onSave, onAction, onEditVoeux, onSubmit, refs }: Props) {
  const status = detail.etat_designation ?? '';
  const provisionalLocked = Boolean(detail.flag_fiche_de_voeux_soumise || detail.verrouille);
  const definitiveLocked = Boolean(detail.date_voeux_definitifs || detail.verrouille);
  const candidateCanEdit = (status === '2ème appel téléphonique' && !provisionalLocked) || (status === 'Session choisir' && !definitiveLocked);

  const actions = useMemo(() => {
    if (status === '2ème appel téléphonique') return [['rejeter', 'Rejeter'], ['valider_appel2', 'Valider l’appel 2']];
    if (status === 'Session choisir') return [['valider_session_choisir', 'Valider la session Choisir'], ['annulerCandidature', 'Annuler la candidature']];
    if (status === 'Attente affectation') return [['annulerCandidature', 'Annuler la candidature']];
    return [];
  }, [status]);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link href={mode === 'recruteur' ? '/recruteur/candidats' : '/candidat'} aria-label="Retour" className="rounded-full p-1 text-muted-foreground hover:bg-background hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="truncate font-display text-2xl font-bold text-foreground">{detail.nom_contact} {detail.prenom_contact}</h1>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {mode === 'recruteur' ? (
              <>
                {detail.verrouille && <Button size="sm" variant="outline" disabled={busy} onClick={() => onSave('voeux', { verrouille: false })}>Déverrouiller les vœux</Button>}
                {actions.map(([key, label]) => (
                  <Button key={key} size="sm" variant="outline" disabled={busy || (key === 'valider_appel2' && !detail.flag_fiche_de_voeux_soumise && !detail.date_voeux_provisoires)} onClick={() => onAction(key)}>{label}</Button>
                ))}
                {status === '2ème appel téléphonique' && !detail.flag_fiche_de_voeux_soumise && !detail.date_voeux_provisoires && (
                  <Button size="sm" variant="outline" onClick={() => onSubmit(false)} disabled={busy}><Send className="mr-2 h-4 w-4" />Soumettre la fiche</Button>
                )}
              </>
            ) : (
              <>
                {candidateCanEdit && <Button size="sm" onClick={onEditVoeux} disabled={!refs}>Éditer vœux</Button>}
                {status === '2ème appel téléphonique' && !provisionalLocked && <Button size="sm" variant="outline" onClick={() => onSubmit(false)} disabled={busy}><Send className="mr-2 h-4 w-4" />Soumettre vœux provisoires</Button>}
                {status === 'Session choisir' && !definitiveLocked && <Button size="sm" variant="outline" onClick={() => onSubmit(true)} disabled={busy}><Send className="mr-2 h-4 w-4" />Soumettre vœux définitifs</Button>}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-7 text-sm">
          <span className="text-muted-foreground">né·e le {formatDateFR(detail.date_naissance)}</span>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">{status}</Badge>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 pl-7">
          <p className="min-w-0 flex-1 text-sm font-medium text-muted-foreground">
            {readStr(detail.domaines_formation, 'domaines_formation', refs)} · Disponible le {formatDateFR(detail.projet_date_depart_souhaitee ?? detail.date_depart_souhaite)} · {readStr(detail.durees, 'durees', refs)}
          </p>
          {mode === 'recruteur' && (
            <div className="flex items-end gap-2">
              <label className="text-xs font-semibold text-muted-foreground">Prochaine revue
                <Input className="mt-1 h-8 w-[140px] bg-background text-xs" type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} />
              </label>
              <Button size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={onReviseReview} aria-label="Enregistrer la revue">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
        {mode === 'recruteur' && status === '2ème appel téléphonique' && !detail.flag_fiche_de_voeux_soumise && !detail.date_voeux_provisoires && (
          <p className="pl-7 text-xs text-muted-foreground">La fiche de vœux provisoire doit être soumise avant de valider cet appel.</p>
        )}
      </CardContent>
    </Card>
  );
}