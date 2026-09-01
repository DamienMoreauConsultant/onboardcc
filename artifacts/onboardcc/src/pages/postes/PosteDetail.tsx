import React, { useEffect, useState } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { ArrowLeft, FileText, Loader2, Lock, RotateCcw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { postesApi, type PosteDetail } from '@/api/postes';

type Props = { mode: 'recruteur' | 'cm' };
const closeable = ['À pourvoir', 'Pré-affecté', 'Pré-réservé', 'Réservé'];
const reopenable = ['Pré-affecté', 'Fermé'];

function Field({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-lg bg-muted/40 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value === null || value === undefined || value === '' ? '—' : String(value)}</dd></div>;
}

export default function PosteDetail({ mode }: Props) {
  const [, params] = useRoute(`${mode === 'cm' ? '/cm' : '/recruteur'}/postes/:id`);
  const [, navigate] = useLocation();
  const [poste, setPoste] = useState<PosteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'fermer' | 'reouvrir' | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    void postesApi.detail(Number(params.id)).then(setPoste).catch((err: any) => setError(err?.response?.data?.error ?? 'Poste introuvable.')).finally(() => setLoading(false));
  }, [params?.id]);

  const submitAction = async () => {
    if (!poste || !action || !commentaire.trim()) return;
    setSaving(true);
    try {
      if (action === 'fermer') await postesApi.close(poste.id_poste, commentaire, files);
      else await postesApi.reopen(poste.id_poste, commentaire, files);
      setPoste(await postesApi.detail(poste.id_poste)); setAction(null); setCommentaire(''); setFiles([]);
    } catch (err: any) { setError(err?.response?.data?.error ?? 'Action impossible.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!poste) return <div className="p-8"><p className="text-destructive">{error || 'Poste introuvable.'}</p></div>;
  const contacts = Array.isArray(poste.contacts_json) ? poste.contacts_json : [];
  const contactByRole = (role: string) => contacts.filter((contact: any) => contact.role === role).map((contact: any) => `${contact.prenom} ${contact.nom}`).join(', ');
  const canAct = mode === 'recruteur' && closeable.includes(poste.etat_designation);
  const canReopen = mode === 'recruteur' && reopenable.includes(poste.etat_designation);

  return <div className="p-6 md:p-8 space-y-6">
    <Link href={`${mode === 'cm' ? '/cm' : '/recruteur'}/postes`}><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Retour à la liste</Button></Link>
    <Card className="overflow-hidden border-primary/20"><div className="border-b bg-primary/[0.04] p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Identification · #{poste.id_poste}</p><h1 className="mt-1 text-3xl font-display font-bold">{poste.crm_key}</h1><p className="mt-1 text-muted-foreground">{poste.fonction} · {poste.pays_designation}</p></div><div className="flex items-center gap-2"><Badge>{poste.etat_designation}</Badge>{canAct && <Button variant="outline" onClick={() => setAction('fermer')}><Lock className="mr-2 h-4 w-4" />Fermer le poste</Button>}{canReopen && <Button variant="outline" onClick={() => setAction('reouvrir')}><RotateCcw className="mr-2 h-4 w-4" />Réouvrir le poste</Button>}</div></div></div><CardContent className="p-6"><dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Pays" value={poste.pays_designation}/><Field label="Type" value={poste.statut_volontaire}/><Field label="Partenaire / ONG" value={poste.ong}/><Field label="Candidat pré-affecté" value={poste.candidat_preaffecte ? 'Oui' : 'Non'}/><Field label="Nom candidat" value={poste.nom_candidat}/><Field label="Fonction" value={poste.fonction}/><Field label="Date de démarrage" value={poste.date_arrivee_souhaitee}/><Field label="Domaine" value={poste.domaine_designation}/></dl></CardContent></Card>
    <Tabs defaultValue="criteres"><TabsList><TabsTrigger value="criteres">Critères et conditions</TabsTrigger><TabsTrigger value="detail">Détail du poste</TabsTrigger><TabsTrigger value="opportunites">Liste des opportunités</TabsTrigger></TabsList>
       <TabsContent value="criteres"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary"/>Critères et conditions</CardTitle></CardHeader><CardContent><dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="CM principal" value={contactByRole('CM1')}/><Field label="CM secondaire" value={contactByRole('CM2')}/><Field label="CHZ" value={contactByRole('CHZ')}/><Field label="Contact mission" value={contactByRole('MIS')}/><Field label="Contact partenaire" value={contactByRole('PAR')}/><Field label="Date de demande" value={poste.date_demande}/><Field label="Priorité" value={poste.priorite}/><Field label="Billet d’avion" value={poste.billet_avion_designation}/><Field label="Indemnité partenaire" value={poste.indemnite_mensuelle_partenaire}/><Field label="Indemnité DCC" value={poste.indemnite_mensuelle_dcc}/><Field label="Gîte et couvert" value={poste.gite_et_couvert}/><Field label="Hébergement" value={poste.hebergement_detail}/><Field label="ODD lié" value={poste.odd_lie}/></dl></CardContent></Card></TabsContent>
      <TabsContent value="detail"><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Détail du poste</CardTitle></CardHeader><CardContent><dl className="grid gap-3"><Field label="Contexte de mission" value={poste.contexte_mission}/><Field label="Objectifs" value={poste.objectifs_mission}/><Field label="Tâches" value={poste.taches}/><Field label="Compétences" value={poste.competences_detail}/><Field label="Dimension ecclésiale" value={poste.dimension_ecclesial}/></dl></CardContent></Card></TabsContent>
      <TabsContent value="opportunites"><Card><CardContent className="p-10 text-center text-sm text-muted-foreground">La liste des opportunités sera développée au prompt 4.{mode === 'cm' ? ' Seules les opportunités proposées au CM seront affichées.' : ''}</CardContent></Card></TabsContent>
    </Tabs>
    <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}><DialogContent><DialogHeader><DialogTitle>{action === 'fermer' ? 'Fermer le poste' : 'Réouvrir le poste'}</DialogTitle><DialogDescription>Un commentaire est obligatoire pour historiser cette action. Vous pouvez joindre jusqu’à 2 pièces.</DialogDescription></DialogHeader><textarea value={commentaire} onChange={(event) => setCommentaire(event.target.value)} placeholder="Justification obligatoire..." className="min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary" /><input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 2))} /><p className="text-xs text-muted-foreground">{files.length}/2 pièce(s) sélectionnée(s)</p>{error && <p className="text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" onClick={() => setAction(null)}>Annuler</Button><Button disabled={!commentaire.trim() || saving} onClick={() => void submitAction()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmer</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}