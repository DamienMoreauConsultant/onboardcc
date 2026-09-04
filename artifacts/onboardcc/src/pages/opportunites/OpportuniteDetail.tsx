import { useEffect, useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { opportunitesApi, type OpportunityAction, type OpportunityDetail } from '@/api/opportunites';
import { formatDateFR } from '@/lib/date';

type Props = { mode: 'recruteur' | 'cm' | 'candidat' };

export default function OpportuniteDetail({ mode }: Props) {
  const [, params] = useRoute(`/${mode}/opportunites/:id`);
  const [detail, setDetail] = useState<OpportunityDetail | null>(null);
  const [error, setError] = useState('');
  const [action, setAction] = useState<OpportunityAction | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    setDetail(null);
    setError('');
    void opportunitesApi.detail(Number(params.id))
      .then(setDetail)
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Opportunité introuvable.'));
  }, [params?.id]);

  const evaluations = useMemo(() => {
    const groups = new Map<string, OpportunityDetail['criteres_detailles']>();
    for (const item of detail?.criteres_detailles ?? []) {
      const key = String(item.date_evaluation);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()];
  }, [detail]);

  if (!detail && !error) return <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!detail) return <p className="p-8 text-destructive">{error}</p>;

  const submitCandidateAction = async () => {
    if (!action || !comment.trim()) return;
    setBusy(true);
    try {
      await opportunitesApi.transition(detail.id_opportunite, action, comment.trim());
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

  const back = mode === 'candidat'
    ? '/candidat/accueil'
    : mode === 'cm'
      ? `/cm/postes/${detail.id_poste}`
      : `/recruteur/postes/${detail.id_poste}`;

  return (
    <div className="space-y-6 p-6 md:p-8">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={back}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div>
              <h1 className="font-display text-2xl font-bold">{detail.poste_crm_key} · {detail.fonction || 'Poste'}</h1>
              <p className="text-sm text-muted-foreground">{detail.ong} · {detail.pays_designation}</p>
            </div>
            <Badge variant="outline" className="ml-auto">{detail.etat_designation}</Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[['Contexte', detail.note_contexte], ['Mission', detail.note_mission], ['Alertes', detail.note_warning]].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value ?? '—'}</p>
              </div>
            ))}
          </div>
          {mode === 'candidat' && detail.etat_designation === 'Mise en lien' && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => setAction('accord-de-principe')}>Accord de principe</Button>
              <Button variant="destructive" onClick={() => setAction('refuser-candidat')}>Refuser</Button>
            </div>
          )}
          {mode === 'candidat' && detail.etat_designation === 'Accord de principe' && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => setAction('accord-definitif')}>Accord définitif</Button>
              <Button variant="destructive" onClick={() => setAction('refuser-candidat')}>Refuser</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {mode !== 'candidat' && (
        <Card>
          <CardHeader><CardTitle>Commentaires de suivi</CardTitle></CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase text-muted-foreground">Recruteur</p><p className="mt-2 text-sm">{detail.appreciation_recruteur || '—'}</p></div>
            <div><p className="text-xs font-semibold uppercase text-muted-foreground">Chargé de mission</p><p className="mt-2 text-sm">{detail.commentaire_charge_mission || '—'}</p></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Détail du scoring</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {evaluations.map(([date, criteria]) => (
            <section key={date}>
              <h2 className="mb-3 font-semibold">Évaluation du {formatDateFR(date)}</h2>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[650px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr><th className="p-3">Critère</th><th className="p-3">Poste</th><th className="p-3">Candidat</th><th className="p-3 text-right">Note</th></tr>
                  </thead>
                  <tbody>
                    {criteria.map((criterion) => (
                      <tr key={criterion.id_criteres_detailles} className="border-t">
                        <td className="p-3 font-medium">{criterion.critere}</td>
                        <td className="p-3 text-muted-foreground">{criterion.valeur_poste || '—'}</td>
                        <td className="p-3 text-muted-foreground">{criterion.valeur_candidat || '—'}</td>
                        <td className="p-3 text-right font-semibold">{criterion.note_obtenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          {!evaluations.length && <p className="text-sm text-muted-foreground">Aucune évaluation enregistrée.</p>}
        </CardContent>
      </Card>
      <Dialog open={Boolean(action)} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmer votre décision</DialogTitle><DialogDescription>Votre commentaire sera conservé dans le suivi de votre candidature.</DialogDescription></DialogHeader>
          <Textarea value={comment} onChange={(event) => setComment(event.target.value.slice(0, 100))} placeholder="Commentaire obligatoire…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Annuler</Button>
            <Button disabled={!comment.trim() || busy} onClick={() => void submitCandidateAction()}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}