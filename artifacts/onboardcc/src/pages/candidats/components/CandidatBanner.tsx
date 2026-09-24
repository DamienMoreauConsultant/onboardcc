import React, { useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check, Loader2, Send, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EtatBadge, type ActionCote } from '@/components/EtatBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CandidatDetail, VoeuxReferences } from '@/api/candidats';
import { formatDateFR } from '@/lib/date';

type Props = {
  detail: CandidatDetail;
  mode: 'recruteur' | 'cm' | 'candidat';
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

const readStr = (value: unknown, key: string, refs?: VoeuxReferences, detail?: any) => {
  if (!value && key !== 'domaines') return '—';
  const values = Array.isArray(value) ? value : [];
  if (key !== 'domaines' && values.length === 0) return '—';
  if (refs) {
    if (key === 'domaines') {
      const domIds = new Set<number>();
      const addDomains = (arr: any) => {
        if (Array.isArray(arr)) {
          arr.forEach((item: any) => {
            if (item.id !== undefined) domIds.add(item.id);
            else if (item.id_domaine !== undefined) domIds.add(item.id_domaine);
          });
        }
      };

      if (detail) {
        addDomains(detail.domaines_formation);
        addDomains(detail.domaines_experience);
        if (Array.isArray(detail.competences)) {
          detail.competences.forEach((comp: any) => {
            const compId = comp.id ?? comp.id_competences ?? comp.id_competence;
            const refComp = refs.competences.find(c => c.id === compId);
            const domainId = comp.id_domaine ?? refComp?.id_domaine;
            if (domainId) {
              domIds.add(domainId);
            }
          });
        }
      }

      return Array.from(domIds)
        .map(id => refs.domaines.find(ref => ref.id === id)?.label)
        .filter(Boolean)
        .join(', ') || '—';
    }
    if (['domaines_formation', 'domaines_experience'].includes(key)) {
      return values.map((item: any) => refs.domaines.find((ref) => ref.id === (item.id ?? item.id_domaine))?.label).filter(Boolean).join(', ') || '—';
    }
    if (key === 'regions') {
      return values.map((item: any) => refs.regions.find((ref) => ref.id === (item.id_region ?? item.region?.id_region))?.label).filter(Boolean).join(', ') || '—';
    }
    if (key === 'durees') {
      return values.map((item: any) => refs.durees.find((ref) => ref.id === (item.id ?? item.id_duree))?.label).filter(Boolean).join(', ') || '—';
    }
  }
  return values.map((item: any) => typeof item === 'object' && item !== null ? (item.designation ?? item.periode ?? item.type_stage ?? item.crm_key ?? '—') : String(item)).join(', ') || '—';
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
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Link href={mode === 'recruteur' ? '/recruteur/candidats' : mode === 'cm' ? '/cm/postes' : '/candidat'} aria-label="Retour" className="rounded-full p-1 text-muted-foreground hover:bg-background hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="truncate font-display text-2xl font-bold text-foreground">{detail.nom_contact} {detail.prenom_contact}</h1>
            {mode === 'candidat' || !detail.etat_calcule
              ? <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">{status}</Badge>
              : <EtatBadge label={detail.etat_calcule} cote={(detail.etat_action_cote as ActionCote) ?? 'aucune'} />}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {mode === 'recruteur' ? (
              <>
                {detail.verrouille && <Button size="sm" variant="outline" disabled={busy} onClick={() => onSave('voeux', { verrouille: false })}>Déverrouiller les vœux</Button>}
                {actions.map(([key, label]) => (
                  <Button key={key} size="sm" variant="outline" disabled={busy || (key === 'valider_appel2' && !detail.flag_fiche_de_voeux_soumise && !detail.date_voeux_provisoires) || (key === 'valider_session_choisir' && !detail.date_voeux_definitifs)} onClick={() => onAction(key)}>{label}</Button>
                ))}
                {status === '2ème appel téléphonique' && !detail.flag_fiche_de_voeux_soumise && !detail.date_voeux_provisoires && (
                  <Button size="sm" variant="outline" onClick={() => onSubmit(false)} disabled={busy}><Send className="mr-2 h-4 w-4" />Soumettre Vœux provisoires pour le candidat</Button>
                )}
                {status === 'Session choisir' && !definitiveLocked && (
                  <Button size="sm" variant="outline" onClick={() => onSubmit(true)} disabled={busy}><Send className="mr-2 h-4 w-4" />Soumettre Vœux définitifs pour le candidat</Button>
                )}
              </>
            ) : mode === 'candidat' ? (
              <>
                {candidateCanEdit && <Button size="sm" onClick={onEditVoeux} disabled={!refs}>Éditer vœux</Button>}
                {status === '2ème appel téléphonique' && !provisionalLocked && (
                  <div className="flex max-w-xl flex-col items-end gap-2">
                    <p className="text-right text-xs font-medium text-destructive">
                      Merci de bien vouloir ne pas soumettre cette fiche de vœux avant votre second appel visio / téléphone avec votre référent. Vous échangerez avec lui sur vos choix et serez invitez à soumettre en fin de réunion ou juste après.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => onSubmit(false)} disabled={busy}><Send className="mr-2 h-4 w-4" />Soumettre vœux provisoires</Button>
                  </div>
                )}
                {status === 'Session choisir' && !definitiveLocked && (
                  <div className="flex max-w-xl flex-col items-end gap-2">
                    <p className="text-right text-xs font-medium text-destructive">
                      Merci de bien vouloir ne pas soumettre cette fiche de vœux avant votre session choisir. Lors de votre entretien individuel avec votre formateur, vous serez invitez à soumettre vos vœux définitifs.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => onSubmit(true)} disabled={busy}><Send className="mr-2 h-4 w-4" />Soumettre vœux définitifs</Button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 pl-7">
          <p className="min-w-0 flex-1 flex flex-wrap items-center gap-1 text-sm font-medium text-muted-foreground">
            <span>{readStr(null, 'domaines', refs, detail)}</span>
            <span className="px-1 text-muted-foreground/50">·</span>
            <span className="inline-flex items-center gap-1 text-foreground"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{formatDateFR(detail.projet_date_depart_souhaitee ?? detail.date_depart_souhaite)}</span>
            <span className="px-1 text-muted-foreground/50">·</span>
            <span>{readStr(detail.durees, 'durees', refs)}</span>
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