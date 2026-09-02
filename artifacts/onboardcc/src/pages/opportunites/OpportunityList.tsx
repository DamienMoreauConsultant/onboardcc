import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { opportunitesApi, type Opportunity, type OpportunityAction } from '@/api/opportunites';

type Props = {
  mode: 'recruteur' | 'cm';
  postId?: number;
  candidateId?: number;
};

type AvailableAction = { action: OpportunityAction; label: string; destructive?: boolean };

function availableActions(opportunity: Opportunity, mode: Props['mode']): AvailableAction[] {
  const state = opportunity.etat_designation;
  if (mode === 'cm') {
    if (state === 'Proposée au CM') return [
      { action: 'approuver', label: 'Approuver' },
      { action: 'rejeter-cm', label: 'Rejeter', destructive: true },
    ];
    return [];
  }
  if (state === 'Non qualifié') return [
    { action: 'proposer-cm', label: 'Proposer au CM' },
    { action: 'rejeter-recruteur', label: 'Rejeter', destructive: true },
  ];
  if (state === 'Approuvé CM') return [
    { action: 'mettre-en-lien', label: 'Mettre en lien' },
    { action: 'rejeter-recruteur', label: 'Rejeter', destructive: true },
  ];
  if (state === 'Mise en lien') return [
    { action: 'accord-de-principe', label: 'Accord de principe' },
    { action: 'refuser-candidat', label: 'Refus candidat', destructive: true },
    { action: 'refuser-partenaire', label: 'Refus partenaire', destructive: true },
  ];
  if (state === 'Accord de principe') return [
    { action: 'accord-definitif', label: 'Accord définitif' },
    { action: 'refuser-candidat', label: 'Refus candidat', destructive: true },
    { action: 'refuser-partenaire', label: 'Refus partenaire', destructive: true },
  ];
  if (state === 'Accepté') return [
    { action: 'decision-dcc', label: 'Décision DCC' },
    { action: 'refuser-candidat', label: 'Refus candidat', destructive: true },
    { action: 'refuser-partenaire', label: 'Refus partenaire', destructive: true },
  ];
  return [];
}

function Score({ label, value, warning = false }: { label: string; value: Opportunity['note_contexte']; warning?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${warning && Number(value) > 0 ? 'border-amber-300 bg-amber-50' : 'bg-muted/30'}`}>
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <strong className="text-lg">{value ?? '—'}</strong>
    </div>
  );
}

export function OpportunityList({ mode, postId, candidateId }: Props) {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<{ item: Opportunity; action: AvailableAction } | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await opportunitesApi.list({ id_poste: postId, id_candidat: candidateId }));
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Impossible de charger les opportunités.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [postId, candidateId]);

  const submit = async () => {
    if (!selected || !comment.trim()) return;
    setBusy(true);
    try {
      await opportunitesApi.transition(selected.item.id_opportunite, selected.action.action, comment.trim());
      setSelected(null);
      setComment('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Transition impossible.');
    } finally {
      setBusy(false);
    }
  };

  const recalculate = async (id: number) => {
    setBusy(true);
    try {
      await opportunitesApi.recalculate(id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Recalcul impossible.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!items.length) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">{error || 'Aucune opportunité disponible.'}</CardContent></Card>;

  return (
    <div className="space-y-4">
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {items.map((item) => {
        const actions = availableActions(item, mode);
        const detailPath = `/${mode}/opportunites/${item.id_opportunite}`;
        return (
          <Card key={item.id_opportunite} className={item.flag_opportunite_obsolete ? 'opacity-60' : ''}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold">
                      {postId ? `${item.prenom_contact} ${item.nom_contact}` : `${item.poste_crm_key} · ${item.fonction || 'Poste'}`}
                    </h3>
                    <Badge variant={item.etat_designation.includes('Rejet') || item.etat_designation.includes('Refus') ? 'destructive' : 'outline'}>
                      {item.etat_designation}
                    </Badge>
                    {Number(item.note_warning) > 0 && <AlertTriangle className="h-4 w-4 text-amber-600" aria-label="Avertissement" />}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {postId ? `${item.poste_crm_key} · ${item.fonction || 'Poste'}` : `${item.ong || 'Partenaire'} · ${item.pays_designation}`}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Score label="Contexte" value={item.note_contexte} />
                  <Score label="Mission" value={item.note_mission} />
                  <Score label="Alertes" value={item.note_warning} warning />
                </div>
                <div className="flex flex-wrap items-center gap-2 xl:max-w-md xl:justify-end">
                  {mode === 'recruteur' && !item.flag_opportunite_obsolete && (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void recalculate(item.id_opportunite)}>
                      <RefreshCw className="mr-1.5 h-4 w-4" />Recalculer
                    </Button>
                  )}
                  {actions.map((action) => (
                    <Button
                      key={action.action}
                      size="sm"
                      variant={action.destructive ? 'destructive' : 'outline'}
                      onClick={() => { setSelected({ item, action }); setComment(''); }}
                    >
                      {action.label}
                    </Button>
                  ))}
                  <Link href={detailPath}>
                    <Button size="sm" variant="ghost">Détail<ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.action.label}</DialogTitle>
            <DialogDescription>Cette action change l’état de l’opportunité. Le commentaire sera conservé dans son suivi.</DialogDescription>
          </DialogHeader>
          <Textarea value={comment} onChange={(event) => setComment(event.target.value.slice(0, 100))} placeholder="Commentaire obligatoire…" className="min-h-28" />
          <p className="text-right text-xs text-muted-foreground">{comment.length}/100</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Annuler</Button>
            <Button variant={selected?.action.destructive ? 'destructive' : 'default'} disabled={!comment.trim() || busy} onClick={() => void submit()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}