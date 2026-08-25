import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { BriefcaseBusiness, ChevronRight, Loader2, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { postesApi, type EtatPoste, type PosteRow } from '@/api/postes';

type Props = { mode: 'recruteur' | 'cm' };

export default function PostesList({ mode }: Props) {
  const [states, setStates] = useState<EtatPoste[]>([]);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [rows, setRows] = useState<PosteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const [availableStates, posts] = await Promise.all([
        postesApi.states(), postesApi.list(selected ?? undefined),
      ]);
      setStates(availableStates);
      setRows(posts);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Impossible de charger les postes.');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { void load(); }, [load]);

  const toggleState = (designation: string) => {
    setSelected((current) => {
      const base = current ?? states.filter((state) => state.designation !== 'Fermé').map((state) => state.designation);
      return base.includes(designation) ? base.filter((value) => value !== designation) : [...base, designation];
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><BriefcaseBusiness className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Espace {mode === 'cm' ? 'CM' : 'recruteur'}</p>
              <h1 className="text-3xl font-display font-bold">Postes</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Consultez les fiches de poste importées depuis le CRM.</p>
        </div>
        <div className="flex gap-2">
          {mode === 'recruteur' && <Link href="/recruteur/postes/import"><Button>Importer des postes</Button></Link>}
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4" />Filtrer par état</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {states.filter((state) => state.designation !== 'Fermé').map((state) => (
            <label key={state.id_etat_poste} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={selected === null ? true : selected.includes(state.designation)} onCheckedChange={() => toggleState(state.designation)} />
              {state.designation}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={selected?.includes('Fermé') ?? false} onCheckedChange={() => toggleState('Fermé')} />Fermé
          </label>
        </CardContent>
      </Card>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center p-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
            rows.length === 0 ? <div className="p-16 text-center text-sm text-muted-foreground">Aucun poste dans ce périmètre.</div> :
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>
                  {['Poste', 'Pays', 'Type', 'Fonction', 'État', 'À qualifier', 'Approuvées', 'Affectation', ''].map((head) => <th key={head} className="whitespace-nowrap px-4 py-3 font-semibold">{head}</th>)}
                </tr></thead>
                <tbody>{rows.map((row) => <tr key={row.id_poste} className="border-t transition-colors hover:bg-muted/30">
                  <td className="px-4 py-4 font-mono font-semibold text-primary"><Link href={`${mode === 'cm' ? '/cm' : '/recruteur'}/postes/${row.id_poste}`}>{row.crm_key}</Link></td>
                  <td className="px-4 py-4">{row.pays_designation}</td><td className="px-4 py-4">{row.statut_volontaire || '—'}</td>
                  <td className="max-w-[220px] px-4 py-4">{row.fonction || '—'}</td><td className="px-4 py-4"><Badge variant="outline">{row.etat_designation}</Badge></td>
                  <td className="px-4 py-4 text-center font-semibold">{row.opp_a_qualifier}</td><td className="px-4 py-4 text-center font-semibold">{row.opp_approuvee}</td><td className="px-4 py-4 text-center font-semibold">{row.opp_en_affectation}</td>
                  <td className="px-4 py-4"><Link href={`${mode === 'cm' ? '/cm' : '/recruteur'}/postes/${row.id_poste}`}><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link></td>
                </tr>)}</tbody>
              </table></div>}
        </CardContent>
      </Card>
    </div>
  );
}