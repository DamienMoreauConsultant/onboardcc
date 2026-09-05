import { useEffect, useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { opportunitesApi, type OpportunityAction, type OpportunityDetail, type OpportunityState } from '@/api/opportunites';
import { candidatsApi } from '@/api/candidats';
import { useQuery } from '@tanstack/react-query';
import { FieldHelp } from '@/pages/candidats/components/FieldHelp';
import { WarningScore } from './WarningScore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateFR } from '@/lib/date';

type Props = { mode: 'recruteur' | 'cm' | 'candidat' };

type AvailableAction = { action: OpportunityAction; label: string; destructive?: boolean };

function getDetailActions(state: OpportunityState, mode: Props['mode']): AvailableAction[] {
  if (mode === 'cm') {
    if (state === 'Proposée au CM') return [
      { action: 'approuver', label: 'Approuver' },
      { action: 'rejeter-cm', label: 'Rejeter', destructive: true },
    ];
  } else if (mode === 'recruteur') {
    if (state === 'Non qualifié') return [
      { action: 'proposer-cm', label: 'Proposer au CM' },
      { action: 'rejeter-recruteur', label: 'Rejeter', destructive: true },
    ];
    if (state === 'Approuvé CM') return [
      { action: 'mettre-en-lien', label: 'Mettre en lien' },
      { action: 'rejeter-recruteur', label: 'Rejeter', destructive: true },
    ];
    if (state === 'Accepté') return [
      { action: 'decision-dcc', label: 'Décision DCC' },
      { action: 'refuser-partenaire', label: 'Refus partenaire', destructive: true },
    ];
  } else if (mode === 'candidat') {
    if (state === 'Mise en lien') return [
      { action: 'accord-de-principe', label: 'Accord de principe' },
      { action: 'refuser-candidat', label: 'Refuser', destructive: true },
    ];
    if (state === 'Accord de principe') return [
      { action: 'accord-definitif', label: 'Accord définitif' },
      { action: 'refuser-candidat', label: 'Refuser', destructive: true },
    ];
  }
  return [];
}

export default function OpportuniteDetail({ mode }: Props) {
  const [, params] = useRoute(`/${mode}/opportunites/:id`);
  const [detail, setDetail] = useState<OpportunityDetail | null>(null);
  const [error, setError] = useState('');
  const [action, setAction] = useState<AvailableAction | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: refs } = useQuery({
    queryKey: ['voeux-references'],
    queryFn: candidatsApi.voeuxReferences,
  });

  useEffect(() => {
    if (!params?.id) return;
    setDetail(null);
    setError('');
    void opportunitesApi.detail(Number(params.id))
      .then(setDetail)
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Opportunité introuvable.'));
  }, [params?.id]);

  const criteriaSections = useMemo(() => {
    if (!detail?.criteres_detailles?.length) return { mission: [], contexte: [], alerte: [] };

    const criteria = detail.criteres_detailles;
    return {
      mission: criteria.filter(c => c.critere === 'Compétences'),
      contexte: criteria.filter(c => ['Région', 'Date de départ', 'Environnement', 'Logement/Couple', 'Logement / couple', 'Durée', 'Langue'].includes(c.critere)),
      alerte: criteria.filter(c => ['Zone orange', 'Hôpital proche', 'Conditions spartiates'].includes(c.critere))
    };
  }, [detail]);

  const getCriterionKey = (crit: string) => {
    const map: Record<string, string> = {
      'Compétences': 'score_competences',
      'Région': 'score_region',
      'Date de départ': 'score_date_depart',
      'Environnement': 'score_environnement',
      'Logement/Couple': 'score_logement_couple',
      'Logement / couple': 'score_logement_couple',
      'Durée': 'score_duree',
      'Langue': 'score_langue',
      'Zone orange': 'score_zone_orange',
      'Hôpital proche': 'score_hopital_proche',
      'Conditions spartiates': 'score_conditions_spartiates'
    };
    return map[crit];
  };

  if (!detail && !error) return <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-primary" data-testid="loading-spinner" /></div>;
  if (!detail) return <p className="p-8 text-destructive" data-testid="error-message">{error}</p>;

  const submitCandidateAction = async () => {
    if (!action || !comment.trim()) return;
    setBusy(true);
    try {
      await opportunitesApi.transition(detail.id_opportunite, action.action, comment.trim());
      setDetail(await opportunitesApi.detail(detail.id_opportunite));
      setError('');
      setAction(null);
      setComment('');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  const availableActions = getDetailActions(detail.etat_designation, mode);

  const renderPosteSummary = () => {
    const content = (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground mb-1">Poste</p>
          <h2 className="font-display text-xl font-bold group-hover:underline">{detail.poste_crm_key} · {detail.fonction || 'Poste'}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {detail.pays_designation} · {detail.ong || 'ONG'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Compétences: {detail.competences_poste || 'Non renseigné'} · Langue: {detail.langues_poste || 'Non renseigné'}
          </p>
        </div>
        {mode !== 'candidat' && <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />}
      </div>
    );

    if (mode === 'candidat') {
      return <div className="flex-1 p-6" data-testid="poste-detail-summary">{content}</div>;
    }
    return (
      <Link href={`/${mode}/postes/${detail.id_poste}?tab=opportunites`} className="flex-1 p-6 hover:bg-muted/50 transition-colors group cursor-pointer block" data-testid="link-poste-detail">
        {content}
      </Link>
    );
  };

  const renderCandidatSummary = () => {
    const content = (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground mb-1">Candidat</p>
          <h2 className="font-display text-xl font-bold group-hover:underline">
            {detail.prenom_contact} {detail.nom_contact}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Né(e) le {detail.date_naissance ? formatDateFR(detail.date_naissance) : 'Non renseigné'} · Départ: {detail.date_depart_possible ? formatDateFR(detail.date_depart_possible) : 'Non renseigné'}
          </p>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">{detail.etat_candidat_designation || 'État non renseigné'}</Badge>
          </div>
        </div>
        {mode !== 'candidat' && <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />}
      </div>
    );

    if (mode === 'candidat') {
      return <div className="flex-1 p-6" data-testid="candidat-detail-summary">{content}</div>;
    }
    return (
      <Link href={`/${mode}/candidats/${detail.id_candidat}?tab=opportunites`} className="flex-1 p-6 hover:bg-muted/50 transition-colors group cursor-pointer block" data-testid="link-candidat-detail">
        {content}
      </Link>
    );
  };

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x">
            {renderPosteSummary()}
            {renderCandidatSummary()}
          </div>

          <div className="bg-muted/30 border-t p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">État de l'opportunité :</span>
              <Badge variant={detail.etat_designation.includes('Rejet') || detail.etat_designation.includes('Refus') ? 'destructive' : 'default'} className="text-sm px-3 py-1" data-testid="badge-status">
                {detail.etat_designation}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {availableActions.map((act) => (
                <Button
                  key={act.action}
                  variant={act.destructive ? 'destructive' : 'default'}
                  onClick={() => { setAction(act); setComment(''); }}
                  data-testid={`button-action-${act.action}`}
                >
                  {act.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {mode !== 'candidat' && (
        <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center" data-testid="comments-flow">
          <Card className="h-full">
            <CardContent className="p-4 flex flex-col h-full">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Recruteur</p>
              <p className="text-sm text-foreground flex-1 break-words">{detail.appreciation_recruteur || '—'}</p>
            </CardContent>
          </Card>

          <ArrowRight className="hidden md:block h-5 w-5 text-muted-foreground/50" />
          <div className="md:hidden flex justify-center py-2"><ArrowRight className="h-5 w-5 text-muted-foreground/50 rotate-90" /></div>

          <Card className="h-full">
            <CardContent className="p-4 flex flex-col h-full">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Chargé de mission</p>
              <p className="text-sm text-foreground flex-1 break-words">{detail.commentaire_charge_mission || '—'}</p>
            </CardContent>
          </Card>

          <ArrowRight className="hidden md:block h-5 w-5 text-muted-foreground/50" />
          <div className="md:hidden flex justify-center py-2"><ArrowRight className="h-5 w-5 text-muted-foreground/50 rotate-90" /></div>

          <Card className="h-full">
            <CardContent className="p-4 flex flex-col h-full">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Candidat</p>
              <p className="text-sm text-foreground flex-1 break-words">{detail.commentaire_candidat || '—'}</p>
            </CardContent>
          </Card>

          <ArrowRight className="hidden md:block h-5 w-5 text-muted-foreground/50" />
          <div className="md:hidden flex justify-center py-2"><ArrowRight className="h-5 w-5 text-muted-foreground/50 rotate-90" /></div>

          <Card className="h-full">
            <CardContent className="p-4 flex flex-col h-full">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Validation Recruteur</p>
              <p className="text-sm text-foreground flex-1 break-words">{detail.commentaire_validation_recruteur || '—'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-xl font-display font-semibold" data-testid="scoring-title">Détail du scoring</h3>

        <Card data-testid="section-mission">
          <CardContent className="p-0 flex flex-col md:flex-row">
            <div className="p-6 bg-muted/20 border-b md:border-b-0 md:border-r flex flex-col items-center justify-center min-w-[200px]">
              <p className="text-sm font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                Mission
                <span data-testid="help-mission">
                  <FieldHelp text={refs?.aides?.['score_note_mission']} label="Aide Mission" />
                </span>
              </p>
              <p className="text-5xl font-bold font-display">{detail.note_mission ?? '—'}</p>
            </div>
            <div className="flex-1 p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-transparent">
                  <TableRow className="hover:bg-transparent border-b-0">
                    <TableHead className="w-1/4">Critère</TableHead>
                    <TableHead className="w-1/4">Poste</TableHead>
                    <TableHead className="w-1/4">Candidat</TableHead>
                    <TableHead className="w-1/4 text-right">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteriaSections.mission.length > 0 ? criteriaSections.mission.map((crit) => (
                    <TableRow key={crit.id_criteres_detailles}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          {crit.critere}
                          <div data-testid={`help-criterion-${getCriterionKey(crit.critere)}`}>
                            <FieldHelp text={refs?.aides?.[getCriterionKey(crit.critere)]} label={`Aide ${crit.critere}`} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{crit.valeur_poste || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{crit.valeur_candidat || '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{crit.note_obtenue ?? '—'}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-16">Aucun critère de mission évalué.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="section-contexte">
          <CardContent className="p-0 flex flex-col md:flex-row">
            <div className="p-6 bg-muted/20 border-b md:border-b-0 md:border-r flex flex-col items-center justify-center min-w-[200px]">
              <p className="text-sm font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                Contexte
                <span data-testid="help-contexte">
                  <FieldHelp text={refs?.aides?.['score_note_contexte']} label="Aide Contexte" />
                </span>
              </p>
              <p className="text-5xl font-bold font-display">{detail.note_contexte ?? '—'}</p>
            </div>
            <div className="flex-1 p-0 overflow-x-auto">
              <div className="p-4 border-b bg-muted/10">
                <p className="text-sm text-muted-foreground">La note contexte est la moyenne des critères ci-dessous.</p>
              </div>
              <Table>
                <TableHeader className="bg-transparent">
                  <TableRow className="hover:bg-transparent border-b-0">
                    <TableHead className="w-1/4">Critère</TableHead>
                    <TableHead className="w-1/4">Poste</TableHead>
                    <TableHead className="w-1/4">Candidat</TableHead>
                    <TableHead className="w-1/4 text-right">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteriaSections.contexte.length > 0 ? criteriaSections.contexte.map((crit) => (
                    <TableRow key={crit.id_criteres_detailles}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          {crit.critere}
                          <div data-testid={`help-criterion-${getCriterionKey(crit.critere)}`}>
                            <FieldHelp text={refs?.aides?.[getCriterionKey(crit.critere)]} label={`Aide ${crit.critere}`} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{crit.valeur_poste || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{crit.valeur_candidat || '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{crit.note_obtenue ?? '—'}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-16">Aucun critère de contexte évalué.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="section-alerte">
          <CardContent className="p-0 flex flex-col md:flex-row">
            <div className="p-6 bg-muted/20 border-b md:border-b-0 md:border-r flex flex-col items-center justify-center min-w-[200px]">
              <p className="text-sm font-semibold uppercase text-muted-foreground mb-4 flex items-center gap-1">
                Alerte
                <span data-testid="help-alerte">
                  <FieldHelp text={refs?.aides?.['score_note_alerte']} label="Aide Alerte" />
                </span>
              </p>
              <WarningScore value={detail.note_warning} className="h-16 w-16" />
            </div>
            <div className="flex-1 p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-transparent">
                  <TableRow className="hover:bg-transparent border-b-0">
                    <TableHead className="w-1/4">Critère</TableHead>
                    <TableHead className="w-1/4">Poste</TableHead>
                    <TableHead className="w-1/4">Candidat</TableHead>
                    <TableHead className="w-1/4 text-right">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteriaSections.alerte.length > 0 ? criteriaSections.alerte.map((crit) => (
                    <TableRow key={crit.id_criteres_detailles}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          {crit.critere}
                          <div data-testid={`help-criterion-${getCriterionKey(crit.critere)}`}>
                            <FieldHelp text={refs?.aides?.[getCriterionKey(crit.critere)]} label={`Aide ${crit.critere}`} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{crit.valeur_poste || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{crit.valeur_candidat || '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{crit.note_obtenue ?? '—'}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-16">Aucun critère d'alerte évalué.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(action)} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.label}</DialogTitle>
            <DialogDescription>Cette action change l'état de l'opportunité. Votre commentaire sera conservé dans le suivi de votre candidature.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, 100))}
            placeholder="Commentaire obligatoire…"
            data-testid="textarea-comment"
          />
          <p className="text-right text-xs text-muted-foreground">{comment.length}/100</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} data-testid="button-cancel">Annuler</Button>
            <Button disabled={!comment.trim() || busy} variant={action?.destructive ? 'destructive' : 'default'} onClick={() => void submitCandidateAction()} data-testid="button-confirm">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
