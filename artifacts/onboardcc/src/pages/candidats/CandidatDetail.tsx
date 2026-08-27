import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { candidatsApi, type CandidatDetail as Detail } from '@/api/candidats';
import { useAuth } from '@/contexts/AuthContext';
import { CandidatBanner } from './components/CandidatBanner';
import { SectionCard } from './components/SectionCard';

type Props = { mode: 'recruteur' | 'candidat' };
type Section = 'etat-civil' | 'projet' | 'voeux';

export default function CandidatDetail({ mode }: Props) {
  const { user } = useAuth();
  const [, params] = useRoute('/recruteur/candidats/:id');
  const id = mode === 'candidat' ? user?.id_candidat : Number(params?.id);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Section | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [reviewDate, setReviewDate] = useState('');

  const { data: refs } = useQuery({
    queryKey: ['voeux-references'],
    queryFn: candidatsApi.voeuxReferences,
  });

  const reload = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setDetail(await candidatsApi.detail(Number(id)));
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Candidat introuvable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [id]);

  useEffect(() => {
    setReviewDate(detail?.date_revue?.slice(0, 10) ?? '');
  }, [detail?.date_revue]);

  const save = async (section: Section, values: Record<string, unknown>) => {
    if (!detail) return;
    setBusy(true);
    try {
      await candidatsApi.save(detail.id_candidat, section, values);
      setEditing(null);
      await reload();
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  };

  const transition = async () => {
    if (!detail || !action || !comment.trim()) return;
    setBusy(true);
    try {
      await candidatsApi.transition(detail.id_candidat, action as 'rejeter' | 'valider_appel2' | 'annulerCandidature' | 'valider_session_choisir', comment, files);
      setAction(null);
      setComment('');
      setFiles([]);
      await reload();
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (definitive: boolean) => {
    if (!detail || !window.confirm('Après soumission, vos vœux seront verrouillés. Confirmer ?')) return;
    setBusy(true);
    try {
      await candidatsApi.submitVoeux(detail.id_candidat, definitive);
      await reload();
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Soumission impossible.');
    } finally {
      setBusy(false);
    }
  };

  const reviseReview = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await candidatsApi.reviseReviewDate(detail.id_candidat, reviewDate || null);
      await reload();
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Date de revue impossible à enregistrer.');
    } finally {
      setBusy(false);
    }
  };

  const status = detail?.etat_designation ?? '';
  const provisionalLocked = Boolean(detail?.flag_fiche_de_voeux_soumise || detail?.verrouille);
  const definitiveLocked = Boolean(detail?.date_voeux_definitifs || detail?.verrouille);
  const candidateCanEditVoeux = (status === '2ème appel téléphonique' && !provisionalLocked) || (status === 'Session choisir' && !definitiveLocked);

  if (loading) return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!detail) return <div className="p-8 text-destructive">{error || 'Candidat introuvable.'}</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 pb-16">
      <CandidatBanner
        detail={detail}
        mode={mode}
        busy={busy}
        reviewDate={reviewDate}
        setReviewDate={setReviewDate}
        onReviseReview={() => void reviseReview()}
        onSave={(section, values) => void save(section, values)}
        onAction={setAction}
        onEditVoeux={() => setEditing('voeux')}
        onSubmit={(definitive) => void submit(definitive)}
        refs={refs}
      />

      {error && <p className="rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {mode === 'candidat' && !candidateCanEditVoeux && (
        <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
          Votre fiche de vœux est en lecture seule à cette étape. Votre chargé de recrutement vous informera lorsqu’une nouvelle modification sera possible.
        </p>
      )}

      <Tabs defaultValue={mode === 'candidat' ? 'voeux' : 'etat-civil'} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="etat-civil">État civil</TabsTrigger>
          <TabsTrigger value="projet">Dossier de candidature</TabsTrigger>
          <TabsTrigger value="voeux">Vœux</TabsTrigger>
          {mode === 'recruteur' && (
            <>
              <TabsTrigger value="opportunites">Opportunités</TabsTrigger>
              <TabsTrigger value="progression">Progression et documents</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="etat-civil" className="focus-visible:outline-none">
          <SectionCard
            section="etat-civil"
            detail={detail}
            editable={editing === 'etat-civil'}
            canEdit={mode === 'recruteur' && Boolean(refs)}
            candidateMode={mode === 'candidat'}
            onEdit={() => setEditing('etat-civil')}
            onSave={(v) => void save('etat-civil', v)}
            refs={refs}
          />
        </TabsContent>

        <TabsContent value="projet" className="focus-visible:outline-none">
          <SectionCard
            section="projet"
            detail={detail}
            editable={editing === 'projet'}
            canEdit={mode === 'recruteur'}
            candidateMode={mode === 'candidat'}
            onEdit={() => setEditing('projet')}
            onSave={(v) => void save('projet', v)}
            refs={refs}
          />
        </TabsContent>

        <TabsContent value="voeux" className="focus-visible:outline-none">
          <SectionCard
            section="voeux"
            detail={detail}
            editable={editing === 'voeux'}
            canEdit={Boolean(refs) && (mode === 'recruteur' || candidateCanEditVoeux)}
            candidateMode={mode === 'candidat'}
            onEdit={() => setEditing('voeux')}
            onSave={(v) => void save('voeux', v)}
            refs={refs}
          />
        </TabsContent>

        {mode === 'recruteur' && (
          <>
            <TabsContent value="opportunites" className="focus-visible:outline-none">
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  {detail.opportunites_total ?? 0} opportunité(s) rattachée(s) à ce candidat.
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="progression" className="focus-visible:outline-none">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Progression et documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(detail.historique ?? []).length ? detail.historique.map((item: any) => (
                    <div key={item.id_historique} className="rounded-lg border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-sm font-semibold">{item.designation}</strong>
                        <span className="text-xs text-muted-foreground">{item.date_evenement?.slice(0, 10)}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.note_ecrite || '—'}</p>
                      {(item.url1_piece_jointe || item.url2_piece_jointe) && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Pièces : {[item.url1_piece_jointe, item.url2_piece_jointe].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">Aucun historique.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer cette transition</DialogTitle>
            <DialogDescription>Un commentaire est obligatoire. Vous pouvez joindre jusqu’à deux pièces.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="Commentaire obligatoire…" 
              className="min-h-[100px]"
            />
            <Input 
              type="file" 
              multiple 
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 2))} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Annuler</Button>
            <Button disabled={!comment.trim() || busy} onClick={() => void transition()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
