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

type Section = 'etat-civil' | 'projet' | 'voeux';
type Props = { mode: 'recruteur' | 'candidat'; initialSection?: Section };

export default function CandidatDetail({ mode, initialSection }: Props) {
  const { user } = useAuth();
  const [, params] = useRoute('/recruteur/candidats/:id');
  const [, navigate] = useLocation();
  const id = mode === 'candidat' ? user?.id_candidat : Number(params?.id);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Section | null>(null);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<Section>(initialSection ?? (mode === 'candidat' ? 'voeux' : 'etat-civil'));
  const [pendingNavigation, setPendingNavigation] = useState<{kind:'tab'|'route'|'history';value:string}|null>(null);
  const historyGuard = useRef({restoring:false,leaving:false});
  const [action, setAction] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState(['','']);
  const [submitDefinitive, setSubmitDefinitive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewDate, setReviewDate] = useState('');

  const { data: refs } = useQuery({
    queryKey: ['voeux-references'],
    queryFn: candidatsApi.voeuxReferences,
  });
  const { data: attachmentConfig } = useQuery({
    queryKey: ['attachment-configuration'],
    queryFn: candidatsApi.attachmentConfiguration,
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
      if(historyGuard.current.restoring) {
        historyGuard.current.restoring=false;
        return;
      }
      const target=new URL(window.location.href);
      historyGuard.current.restoring=true;
      window.history.go(1);
      setPendingNavigation({kind:'history',value:toAppPath(target)});
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
      await candidatsApi.transition(detail.id_candidat, action as 'rejeter' | 'valider_appel2' | 'annulerCandidature' | 'valider_session_choisir', comment, {
        description:attachmentDescription,
        urls:attachmentUrls,
      });
      setAction(null);
      setComment('');
      setAttachmentDescription('');
      setAttachmentUrls(['','']);
      await reload();
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
      await reload();
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
      window.setTimeout(() => window.history.go(-2),0);
    }
  };

  const onDirtyChange = useCallback((section: Section, changed: boolean) => {
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
                        <span className="text-xs text-muted-foreground">{formatDateFR(item.date_evenement)}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.note_ecrite || '—'}</p>
                      {(item.url1_piece_jointe || item.url2_piece_jointe) && (
                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                          {[item.url1_piece_jointe, item.url2_piece_jointe].map((value,index) => {
                            const href=safeUrl(value);
                            return href ? <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline"><ExternalLink className="h-3 w-3"/>Pièce jointe {index+1}</a> : null;
                          })}
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
            <DialogDescription>Un commentaire est obligatoire. Vous pouvez référencer jusqu’à deux pièces déposées dans l’espace partagé.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="Commentaire obligatoire…" 
              className="min-h-[100px]"
            />
            {safeUrl(attachmentConfig?.storageUrl) && (
              <a href={safeUrl(attachmentConfig?.storageUrl)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <ExternalLink className="h-4 w-4"/>Accéder à l’espace de stockage partagé
              </a>
            )}
            <Input value={attachmentDescription} onChange={(e) => setAttachmentDescription(e.target.value)} placeholder="Description des pièces jointes" maxLength={50}/>
            <Input type="url" value={attachmentUrls[0]} onChange={(e) => setAttachmentUrls([e.target.value,attachmentUrls[1]])} placeholder="URL de la pièce jointe 1"/>
            <Input type="url" value={attachmentUrls[1]} onChange={(e) => setAttachmentUrls([attachmentUrls[0],e.target.value])} placeholder="URL de la pièce jointe 2"/>
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

      <AlertDialog open={!!pendingNavigation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
            <AlertDialogDescription>Vous avez des modifications non enregistrées sur cet onglet. Voulez-vous les abandonner ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)}>Continuer l’édition</AlertDialogCancel>
            <AlertDialogAction onClick={abandonChanges}>Abandonner les modifications</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={submitDefinitive !== null} onOpenChange={(open) => !open && setSubmitDefinitive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Soumettre la fiche de vœux</AlertDialogTitle>
            <AlertDialogDescription>Après soumission, les vœux seront verrouillés. Confirmer la soumission {submitDefinitive ? 'définitive' : 'provisoire'} ?</AlertDialogDescription>
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
