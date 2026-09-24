import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { candidatsApi, type CandidatDetail as Detail } from '@/api/candidats';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateFR } from '@/lib/date';
import { CandidatBanner } from './components/CandidatBanner';
import { SectionCard } from './components/SectionCard';
import { OpportunityList } from '@/pages/opportunites/OpportunityList';

type EditableSection = 'etat-civil' | 'projet' | 'voeux';
type Section = EditableSection | 'opportunites' | 'progression';
type Props = { mode: 'recruteur' | 'cm' | 'candidat'; initialSection?: EditableSection };

export default function CandidatDetail({ mode, initialSection }: Props) {
  const { user } = useAuth();
  const [, params] = useRoute(mode === 'cm' ? '/cm/candidats/:id' : '/recruteur/candidats/:id');
  const [, navigate] = useLocation();
  const id = mode === 'candidat' ? user?.id_candidat : Number(params?.id);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<EditableSection | null>(null);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<Section>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab === 'opportunites' && mode !== 'candidat') return 'opportunites';
    return initialSection ?? (mode === 'candidat' ? 'voeux' : 'etat-civil');
  });
  const [pendingNavigation, setPendingNavigation] = useState<{kind:'tab'|'route'|'history';value:string}|null>(null);
  const historyGuard = useRef({leaving:false});
  const [action, setAction] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<(File | null)[]>([null, null]);
  const [fileError, setFileError] = useState('');
  const [submitDefinitive, setSubmitDefinitive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewDate, setReviewDate] = useState('');
  const detailRequest = useRef(0);

  const { data: refs } = useQuery({
    queryKey: ['voeux-references'],
    queryFn: candidatsApi.voeuxReferences,
  });

  const reload = useCallback(async (showLoading = false) => {
    if (!id) return;
    const request = ++detailRequest.current;
    if (showLoading) setLoading(true);
    try {
      const nextDetail = await candidatsApi.detail(Number(id));
      if (request !== detailRequest.current) return;
      setDetail(nextDetail);
      setError('');
    } catch (e: any) {
      if (request !== detailRequest.current) return;
      setError(e.response?.data?.error ?? 'Candidat introuvable.');
    } finally {
      if (showLoading && request === detailRequest.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload(true);
  }, [reload]);

  // Dans l'espace candidat, chaque onglet possède une URL stable afin que
  // l'État civil (et donc la section Famille) soit directement accessible.
  useEffect(() => {
    if (initialSection) setActiveTab(initialSection);
  }, [initialSection]);

  useEffect(() => {
    setReviewDate(detail?.date_revue?.slice(0, 10) ?? '');
  }, [detail?.date_revue]);

  useEffect(() => {
    if (!dirty || !editing) return;
    const currentUrl=window.location.href;
    const guardId=`dcc-dirty-${Date.now()}`;
    window.history.pushState({...window.history.state,__dccDirtyGuard:guardId},'',currentUrl);
    const toAppPath=(url:URL) => {
      const base=import.meta.env.BASE_URL.replace(/\/$/,'');
      return `${url.pathname.startsWith(base) ? url.pathname.slice(base.length) || '/' : url.pathname}${url.search}${url.hash}`;
    };
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation({kind:'route',value:toAppPath(url)});
    };
    const onBeforeUnload=(event:BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue=true;
    };
    const onPopState=() => {
      if(historyGuard.current.leaving) return;
      setPendingNavigation({kind:'history',value:''});
    };
    document.addEventListener('click',onClick,true);
    window.addEventListener('beforeunload',onBeforeUnload);
    window.addEventListener('popstate',onPopState);
    return () => {
      document.removeEventListener('click',onClick,true);
      window.removeEventListener('beforeunload',onBeforeUnload);
      window.removeEventListener('popstate',onPopState);
      if(window.history.state?.__dccDirtyGuard===guardId && !historyGuard.current.leaving) window.history.back();
    };
  }, [dirty, editing]);

  const save = async (section: EditableSection, values: Record<string, unknown>) => {
    if (!detail) return;
    setBusy(true);
    try {
      await candidatsApi.save(detail.id_candidat, section, values);
      if (editing === section) {
        setEditing(null);
        setDirty(false);
      }
      await reload(false);
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
      await candidatsApi.transition(detail.id_candidat, action as 'rejeter' | 'valider_appel2' | 'annulerCandidature' | 'valider_session_choisir', comment, {
        description:attachmentDescription,
        files:attachmentFiles.filter((f): f is File => f !== null),
      });
      setAction(null);
      setComment('');
      setAttachmentDescription('');
      setAttachmentFiles([null, null]);
      setFileError('');
      await reload(false);
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!detail || submitDefinitive === null) return;
    setBusy(true);
    try {
      await candidatsApi.submitVoeux(detail.id_candidat, submitDefinitive);
      setSubmitDefinitive(null);
      await reload(false);
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Soumission impossible.');
    } finally {
      setBusy(false);
    }
  };

  const requestTabChange = (nextTab: string) => {
    if (dirty && editing) {
      setPendingNavigation({kind:'tab',value:nextTab});
      return;
    }
    setEditing(null);
    const section = nextTab as Section;
    setActiveTab(section);
    if (mode === 'candidat') navigate(`/candidat/${section}`);
  };

  const abandonChanges = () => {
    const pending=pendingNavigation;
    setEditing(null);
    setDirty(false);
    setPendingNavigation(null);
    if(pending?.kind==='tab') {
      const section = pending.value as Section;
      setActiveTab(section);
      if (mode === 'candidat') navigate(`/candidat/${section}`);
    }
    if(pending?.kind==='route') {
      historyGuard.current.leaving=true;
      navigate(pending.value,{replace:true});
    }
    if(pending?.kind==='history') {
      historyGuard.current.leaving=true;
      window.setTimeout(() => window.history.back(),0);
    }
  };

  const continueEditing = () => {
    if(pendingNavigation?.kind === 'history') {
      const guardId=`dcc-dirty-${Date.now()}`;
      window.history.pushState({...window.history.state,__dccDirtyGuard:guardId},'',window.location.href);
    }
    setPendingNavigation(null);
  };

  const onDirtyChange = useCallback((section: EditableSection, changed: boolean) => {
    if(editing===section) setDirty(changed);
  },[editing]);

  const safeUrl = (value: unknown) => {
    if(typeof value!=='string') return null;
    try {
      const parsed=new URL(value);
      return ['http:','https:'].includes(parsed.protocol) ? parsed.href : null;
    } catch {
      return null;
    }
  };

  const reviseReview = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await candidatsApi.reviseReviewDate(detail.id_candidat, reviewDate || null);
      await reload(false);
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Date de revue impossible à enregistrer.');
    } finally {
      setBusy(false);
    }
  };

  const statusCode = detail?.id_etat_candidat ?? '';
  const provisionalLocked = Boolean(detail?.flag_fiche_de_voeux_soumise || detail?.verrouille);
  const definitiveLocked = Boolean(detail?.date_voeux_definitifs || detail?.verrouille);
  const candidateCanEditVoeux = (statusCode === 'AP2' && !provisionalLocked) || (statusCode === 'CHO' && !definitiveLocked);

  if (loading) return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!detail) return <div className="p-8 text-destructive">{error || 'Candidat introuvable.'}</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 pb-16">
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
        onSubmit={setSubmitDefinitive}
        refs={refs}
      />

      {error && <p className="rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {mode === 'candidat' && !candidateCanEditVoeux && (
        <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
          Votre fiche de vœux est en lecture seule à cette étape. Votre chargé de recrutement vous informera lorsqu’une nouvelle modification sera possible.
        </p>
      )}

      <Tabs value={activeTab} onValueChange={requestTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="etat-civil">État civil</TabsTrigger>
          <TabsTrigger value="projet">Dossier de candidature</TabsTrigger>
          <TabsTrigger value="voeux">Vœux</TabsTrigger>
          {mode !== 'candidat' && (
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
            onCancel={() => setEditing(null)}
            onSave={(v) => void save('etat-civil', v)}
            onDirtyChange={(changed) => onDirtyChange('etat-civil',changed)}
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
            onCancel={() => setEditing(null)}
            onSave={(v) => void save('projet', v)}
            onDirtyChange={(changed) => onDirtyChange('projet',changed)}
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
            onCancel={() => setEditing(null)}
            onSave={(v) => void save('voeux', v)}
            onDirtyChange={(changed) => onDirtyChange('voeux',changed)}
            refs={refs}
          />
        </TabsContent>

        {mode !== 'candidat' && (
          <>
            <TabsContent value="opportunites" className="focus-visible:outline-none">
            <OpportunityList mode={mode} candidateId={detail.id_candidat} onChanged={() => reload(false)} />
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
                        <span className="text-xs text-muted-foreground">{formatDateFR(item.date_evenement)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{item.note_ecrite || '—'}</p>
                      {(item.url1_piece_jointe || item.url2_piece_jointe) && (
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                          {[item.url1_piece_jointe, item.url2_piece_jointe].map((value,index) => {
                            const href=safeUrl(value);
                            return href ? <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline"><ExternalLink className="h-3 w-3"/>Pièce jointe {index+1}</a> : null;
                          })}
                          {item.pj_description && <span className="text-muted-foreground">({item.pj_description})</span>}
                        </div>
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
            <DialogDescription>Un commentaire est obligatoire. Vous pouvez joindre jusqu’à deux fichiers PDF, JPEG ou PNG de 5 Mio maximum chacun.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="Commentaire obligatoire…" 
              className="min-h-[100px]"
            />
            {[0, 1].map((slot) => (
              <div key={slot} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Pièce jointe {slot + 1}</label>
                <Input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
                      setFileError('Chaque pièce jointe doit être un PDF, JPEG ou PNG de 5 Mio maximum.');
                      event.target.value = '';
                      return;
                    }
                    setFileError('');
                    setAttachmentFiles((prev) => prev.map((f, i) => (i === slot ? file : f)));
                  }}
                />
                {attachmentFiles[slot] && <p className="text-xs text-muted-foreground">{attachmentFiles[slot]!.name}</p>}
              </div>
            ))}
            {fileError && <p className="rounded bg-destructive/10 p-2 text-xs text-destructive">{fileError}</p>}
            <Input value={attachmentDescription} onChange={(e) => setAttachmentDescription(e.target.value)} placeholder={attachmentFiles.some(Boolean) ? 'Description obligatoire des pièces jointes' : 'Description des pièces jointes (facultative)'} maxLength={50}/>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAction(null); setAttachmentFiles([null, null]); setAttachmentDescription(''); setFileError(''); }}>Annuler</Button>
            <Button disabled={!comment.trim() || (attachmentFiles.some(Boolean) && !attachmentDescription.trim()) || busy} onClick={() => void transition()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingNavigation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
            <AlertDialogDescription>Vous avez des modifications non enregistrées sur cet onglet. Voulez-vous les abandonner ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={continueEditing}>Continuer l’édition</AlertDialogCancel>
            <AlertDialogAction onClick={abandonChanges}>Abandonner les modifications</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={submitDefinitive !== null} onOpenChange={(open) => !open && setSubmitDefinitive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{mode === 'recruteur' ? (submitDefinitive ? 'Soumettre vœux définitifs pour le candidat' : 'Soumettre vœux provisoires pour le candidat') : 'Soumettre la fiche de vœux'}</AlertDialogTitle>
            <AlertDialogDescription className={mode === 'recruteur' ? 'text-destructive' : undefined}>
              {mode === 'recruteur'
                ? `Vous confirmez agir pour le compte du candidat. La soumission ${submitDefinitive ? 'définitive' : 'provisoire'} sera verrouillée et votre identité sera inscrite dans l’historique.`
                : `Après soumission, les vœux seront verrouillés. Confirmer la soumission ${submitDefinitive ? 'définitive' : 'provisoire'} ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => void submit()}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
