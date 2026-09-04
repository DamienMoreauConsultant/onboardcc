import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { BriefcaseBusiness, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { postesApi, type PosteRow } from '@/api/postes';
import { ColumnFilter } from '@/components/data-table/ColumnFilter';
import { KpiHeader } from '@/components/data-table/KpiHeader';
import { ListSearch } from '@/components/data-table/ListSearch';
import { ScrollableTable, stickyTableHeaderClass } from '@/components/data-table/ScrollableTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Props = { mode: 'recruteur' | 'cm' };

const filterColumns = [
  { key: 'pays', label: 'Pays' },
  { key: 'type', label: 'Type' },
  { key: 'fonction', label: 'Fonction' },
  { key: 'etat', label: 'État' },
] as const;

export default function PostesList({ mode }: Props) {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [rows, setRows] = useState<PosteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await postesApi.list(filters));
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Impossible de charger les postes.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);

  const applyFilter = (key: string, values: string[]) => {
    setFilters((current) => {
      const next = { ...current };
      if (values.length) next[key] = values;
      else delete next[key];
      return next;
    });
  };
  const filterFor = (key: string, label: string) => (
    <ColumnFilter columnKey={key} endpoint="/postes/filtres" label={label} activeValues={filters[key] ?? []} onApply={(values) => applyFilter(key, values)} />
  );
  const detailBase = mode === 'cm' ? '/cm' : '/recruteur';
  const displayedRows = useMemo(() => {
    const query = search.toLocaleLowerCase('fr-FR');
    if (!query) return rows;
    return rows.filter((row) => [
      row.pays_designation,
      row.statut_volontaire,
      row.fonction,
      row.etat_designation,
      row.opp_a_qualifier,
      row.opp_approuvee,
      row.opp_en_affectation,
      row.flag_poste_deja_mis_en_lien ? 'Oui' : 'Non',
    ].some((value) => String(value ?? '').toLocaleLowerCase('fr-FR').includes(query)));
  }, [rows, search]);

  return (
    <div className="space-y-5 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><BriefcaseBusiness className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Espace {mode === 'cm' ? 'CM' : 'recruteur'}</p>
              <h1 className="text-3xl font-display font-bold">Postes</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Consultez les fiches et filtrez directement depuis les colonnes.</p>
        </div>
        <div className="flex gap-2">
          {mode === 'recruteur' && <Link href="/recruteur/postes/import"><Button>Importer des postes</Button></Link>}
          <Button size="icon" variant="outline" onClick={() => void load()} disabled={loading} aria-label="Actualiser la liste" title="Actualiser">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      <ListSearch value={searchInput} onChange={setSearchInput} onSubmit={() => setSearch(searchInput.trim())} loading={loading} />

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center p-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <ScrollableTable>
              <table className="min-w-[1040px] w-full text-sm">
                <thead className={stickyTableHeaderClass}>
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Poste</th>
                    {filterColumns.map((column) => (
                      <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                        <span className="inline-flex items-center">{column.label}{filterFor(column.key, column.label)}</span>
                      </th>
                    ))}
                    <th className="w-16 px-4 py-3 text-center"><KpiHeader kind="qualify" scope="poste" /></th>
                    <th className="w-16 px-4 py-3 text-center"><KpiHeader kind="approved" scope="poste" /></th>
                    <th className="w-16 px-4 py-3 text-center"><KpiHeader kind="assignment" scope="poste" /></th>
                    <th className="whitespace-nowrap px-4 py-3 text-center">Mis en lien</th>
                    <th className="w-10 px-4 py-3"><span className="sr-only">Ouvrir</span></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row) => (
                    <tr key={row.id_poste} className="border-t transition-colors hover:bg-muted/30">
                      <td className="px-4 py-4 font-mono font-semibold text-primary"><Link href={`${detailBase}/postes/${row.id_poste}`}>{row.crm_key}</Link></td>
                      <td className="px-4 py-4">{row.pays_designation}</td>
                      <td className="px-4 py-4">{row.statut_volontaire || '—'}</td>
                      <td className="max-w-[220px] px-4 py-4">{row.fonction || '—'}</td>
                      <td className="px-4 py-4"><Badge variant="outline">{row.etat_designation}</Badge></td>
                      <td className="px-4 py-4 text-center font-semibold">{row.opp_a_qualifier}</td>
                      <td className="px-4 py-4 text-center font-semibold">{row.opp_approuvee}</td>
                      <td className="px-4 py-4 text-center font-semibold">{row.opp_en_affectation}</td>
                      <td className="px-4 py-4 text-center"><Badge variant={row.flag_poste_deja_mis_en_lien ? 'default' : 'secondary'}>{row.flag_poste_deja_mis_en_lien ? 'Oui' : 'Non'}</Badge></td>
                      <td className="px-4 py-4"><Link href={`${detailBase}/postes/${row.id_poste}`} aria-label={`Ouvrir le poste ${row.crm_key}`}><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link></td>
                    </tr>
                  ))}
                  {!displayedRows.length && <tr><td colSpan={10} className="p-16 text-center text-muted-foreground">Aucun poste ne correspond aux filtres ou à la recherche.</td></tr>}
                </tbody>
              </table>
            </ScrollableTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}