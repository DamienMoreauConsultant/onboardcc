import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, RefreshCw, Users } from 'lucide-react';
import { candidatsApi, type CandidatRow } from '@/api/candidats';
import { formatDateFR } from '@/lib/date';
import { ColumnFilter } from '@/components/data-table/ColumnFilter';
import { KpiHeader } from '@/components/data-table/KpiHeader';
import { ListSearch } from '@/components/data-table/ListSearch';
import { ScrollableTable, stickyTableHeaderClass } from '@/components/data-table/ScrollableTable';
import { Badge } from '@/components/ui/badge';
import { EtatBadge, EtatLegend, type ActionCote } from '@/components/EtatBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const filterColumns = [
  { key: 'domaine', label: 'Domaine' },
  { key: 'region', label: 'Région' },
  { key: 'duree', label: 'Durée' },
  { key: 'langue', label: 'Langue' },
  { key: 'etat', label: 'État' },
] as const;

export default function CandidatsList() {
  /* Filtres initiaux passés dans l'URL par les cartes du cockpit (?etat=… / ?suivi=…). */
  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    const params = new URLSearchParams(window.location.search);
    const initial: Record<string, string[]> = {};
    for (const key of ['etat', 'suivi']) {
      const values = params.getAll(key).filter(Boolean);
      if (values.length) initial[key] = values;
    }
    return initial;
  });
  const [rows, setRows] = useState<CandidatRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await candidatsApi.list(page, filters, search);
      setRows(result.items);
      setTotal(result.total);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Impossible de charger les candidats.');
    } finally {
      setLoading(false);
    }
  }, [filters, page, search]);

  useEffect(() => { void load(); }, [load]);

  const applyFilter = (key: string, values: string[]) => {
    setPage(1);
    setFilters((current) => {
      const next = { ...current };
      if (values.length) next[key] = values;
      else delete next[key];
      return next;
    });
  };
  const pages = Math.max(1, Math.ceil(total / 20));
  const applySearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };
  const filterFor = (key: string, label: string) => (
    <ColumnFilter columnKey={key} endpoint="/candidats/filtres" label={label} activeValues={filters[key] ?? []} onApply={(values) => applyFilter(key, values)} />
  );

  return (
    <div className="space-y-5 p-6 md:p-8">
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Espace recruteur</p>
            <h1 className="text-3xl font-display font-bold">Candidats</h1>
            <p className="mt-1 text-sm text-muted-foreground">Suivez les dossiers et filtrez directement depuis les colonnes.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/recruteur/candidats/import"><Button>Importer des candidats</Button></Link>
          <Button size="icon" variant="outline" onClick={() => void load()} disabled={loading} aria-label="Actualiser la liste" title="Actualiser">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      <ListSearch value={searchInput} onChange={setSearchInput} onSubmit={applySearch} loading={loading} />

      {filters.suivi?.length ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary">
            Filtre du cockpit : {filters.suivi.join(', ')}
            <button type="button" aria-label="Retirer le filtre du cockpit" className="font-bold" onClick={() => applyFilter('suivi', [])}>×</button>
          </span>
        </div>
      ) : null}
      <EtatLegend />
      {error && <p className="rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center p-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <>
              <ScrollableTable>
                <table className="min-w-[1320px] w-full text-sm">
                  <thead className={stickyTableHeaderClass}>
                    <tr>
                      <th className="whitespace-nowrap px-3 py-3">Nom</th>
                      <th className="whitespace-nowrap px-3 py-3">Prénom</th>
                      {filterColumns.slice(0, 4).map((column) => (
                        <th className="whitespace-nowrap px-3 py-3" key={column.key}>
                          <span className="inline-flex items-center">{column.label}{filterFor(column.key, column.label)}</span>
                        </th>
                      ))}
                      <th className="whitespace-nowrap px-3 py-3">
                        <span className="inline-flex items-center">État{filterFor('etat', 'État')}</span>
                      </th>
                      <th className="whitespace-nowrap px-3 py-3">Prochaine revue</th>
                      <th className="w-16 px-3 py-3 text-center"><KpiHeader kind="qualify" scope="candidat" /></th>
                      <th className="w-16 px-3 py-3 text-center"><KpiHeader kind="approved" scope="candidat" /></th>
                      <th className="w-16 px-3 py-3 text-center"><KpiHeader kind="assignment" scope="candidat" /></th>
                      <th className="whitespace-nowrap px-3 py-3 text-center">Mis en lien</th>
                      <th className="w-10 px-3 py-3"><span className="sr-only">Ouvrir</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr className="border-t hover:bg-muted/30" key={row.id_candidat}>
                        <td className="px-3 py-3 font-semibold"><Link className="text-primary hover:underline" href={`/recruteur/candidats/${row.id_candidat}`}>{row.nom_contact}</Link></td>
                        <td className="px-3 py-3">{row.prenom_contact}</td>
                        <td className="px-3 py-3">{row.domaines || '—'}</td>
                        <td className="px-3 py-3">{row.regions || '—'}</td>
                        <td className="px-3 py-3">{row.duree || '—'}</td>
                        <td className="px-3 py-3">{row.langues || '—'}</td>
                        <td className="px-3 py-3"><EtatBadge label={row.etat_calcule ?? row.etat_designation} cote={(row.etat_action_cote as ActionCote) ?? 'aucune'} /></td>
                        <td className={`px-3 py-3 ${row.alerte_revue ? 'font-medium text-destructive' : ''}`}>{row.alerte_revue && <AlertTriangle className="mr-1 inline h-4 w-4" />}{formatDateFR(row.date_revue)}</td>
                        <td className="px-3 py-3 text-center">{row.opportunites_a_qualifier ?? 0}</td>
                        <td className="px-3 py-3 text-center">{row.opportunites_approuvees ?? 0}</td>
                        <td className="px-3 py-3 text-center">{row.opportunites_affectation ?? 0}</td>
                        <td className="px-3 py-3 text-center"><Badge variant={row.flag_candidat_deja_mis_en_lien ? 'default' : 'secondary'}>{row.flag_candidat_deja_mis_en_lien ? 'Oui' : 'Non'}</Badge></td>
                        <td className="px-3 py-3"><Link href={`/recruteur/candidats/${row.id_candidat}`} aria-label={`Ouvrir le dossier de ${row.prenom_contact} ${row.nom_contact}`}><ChevronRight className="h-4 w-4" /></Link></td>
                      </tr>
                    ))}
                    {!rows.length && <tr><td colSpan={13} className="p-16 text-center text-muted-foreground">Aucun candidat ne correspond aux filtres ou à la recherche.</td></tr>}
                  </tbody>
                </table>
              </ScrollableTable>
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                <span>{total} candidat(s) · page {page}/{pages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" />Précédent</Button>
                  <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Suivant<ChevronRight className="ml-1 h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}