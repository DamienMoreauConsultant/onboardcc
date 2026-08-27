import React, { useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CandidatDetail, VoeuxReferences } from '@/api/candidats';

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

const readStr = (v: unknown, key: string, refs?: VoeuxReferences) => {
  if (!v || !Array.isArray(v)) return '—';
  if (refs) {
    if (['domaines_formation', 'domaines_experience'].includes(key)) {
      return v.map((item: any) => refs.domaines.find(r => r.id === (item.id ?? item.id_domaine))?.label).filter(Boolean).join(', ') || '—';
    }
    if (key === 'regions') {
      return v.map((item: any) => {
        const idRegion = item.id_region ?? item.region?.id_region;
        const r = refs.regions.find(ref => ref.id === idRegion)?.label;
        return r ? `${r} (${item.degre || 'neutre'})` : '';
      }).filter(Boolean).join(', ') || '—';
    }
  }
  return v.map((item) => typeof item === 'object' && item !== null ? (item.designation ?? item.periode ?? item.type_stage ?? item.crm_key ?? '—') : String(item)).join(', ') || '—';
};
const dateLabel = (value: unknown) => {
  if (typeof value !== 'string' || !value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

export function CandidatBanner({
  detail,
  mode,
  busy,
  reviewDate,
  setReviewDate,
  onReviseReview,
  onSave,
  onAction,
  onEditVoeux,
  onSubmit,
  refs
}: Props) {
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
      <CardContent className="flex flex-col gap-4 p-6">
        {/* Line 1: Back affordance + DOSSIER CANDIDAT, and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href={mode === 'recruteur' ? '/recruteur/candidats' : '/candidat'} className="flex items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Dossier Candidat
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mode === 'recruteur' ? (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Prochaine revue
                    <Input className="mt-1 h-8 w-[140px] bg-background text-xs" type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
                  </label>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => onReviseReview()}>Enregistrer la revue</Button>
                </div>
                {detail.verrouille && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => onSave('voeux', { verrouille: false })}>
                    Déverrouiller les vœux
                  </Button>
                )}
                {actions.map(([key, label]) => (
                  <Button key={key} size="sm" variant="outline" onClick={() => onAction(key)}>{label}</Button>
                ))}
              </>
            ) : (
              <>
                {candidateCanEdit && (
                  <Button size="sm" onClick={onEditVoeux} disabled={!refs}>
                    Éditer vœux
                  </Button>
                )}
                {status === '2ème appel téléphonique' && !provisionalLocked && (
                  <Button size="sm" variant="outline" onClick={() => onSubmit(false)} disabled={busy}>
                    <Send className="mr-2 h-4 w-4" /> Soumettre vœux provisoires
                  </Button>
                )}
                {status === 'Session choisir' && !definitiveLocked && (
                  <Button size="sm" variant="outline" onClick={() => onSubmit(true)} disabled={busy}>
                    <Send className="mr-2 h-4 w-4" /> Soumettre vœux définitifs
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Line 2: Name plus state badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-display font-bold text-foreground">
            {detail.prenom_contact} {detail.nom_contact}
          </h1>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20">
            {status}
          </Badge>
        </div>

        {/* Line 3: Summary metadata */}
        <div className="text-sm font-medium text-muted-foreground/80">
          {readStr(detail.domaines_formation, 'domaines_formation', refs)} · {readStr(detail.regions, 'regions', refs)} · Disponible le {dateLabel(detail.projet_date_depart_souhaitee ?? detail.date_depart_souhaite)} · {readStr(detail.durees, 'durees', refs)}
        </div>
      </CardContent>
    </Card>
  );
}
