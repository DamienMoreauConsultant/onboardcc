import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Loader2, RefreshCw, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { opportunitesApi, type Opportunity } from '@/api/opportunites';
import { WarningScore } from './WarningScore';
import { ListSearch } from '@/components/data-table/ListSearch';
import { ColumnFilter } from '@/components/data-table/ColumnFilter';

type Props = {
  mode: 'recruteur' | 'cm';
  postId?: number;
  candidateId?: number;
  approvalFilter?: 'proposee-au-cm' | 'proposee-au-cm-historique';
  refreshKey?: number;
  onChanged?: () => void | Promise<void>;
};

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr');

export function OpportunityList({ mode, postId, candidateId, approvalFilter, refreshKey }: Props) {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const isCandidateOriented = !!candidateId;

  const load = async () => {
    setLoading(true);
    try {
      setItems(await opportunitesApi.list({ id_poste: postId, id_candidat: candidateId, approbation: approvalFilter }));
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Impossible de charger les opportunités.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [postId, candidateId, approvalFilter, refreshKey]);

  const recalculateAll = async () => {
    setRecalculating(true);
    try {
      await opportunitesApi.recalculateList({ id_poste: postId, id_candidat: candidateId });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Recalcul impossible.');
    } finally {
      setRecalculating(false);
    }
  };

  const applyFilter = (key: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  const groups = useMemo(() => {
    let result = items;

    // A dashboard drill-down is an explicit server-side selection, so it must
    // retain every matching opportunity (including a previously rejected or
    // low-scoring one in the historical view).
    if (!showAll && !approvalFilter) {
      result = result.filter(item => {
        if (item.flag_opportunite_obsolete || item.flag_opportunite_non_retenu) return false;
        const nm = item.note_mission !== null ? Number(item.note_mission) : NaN;
        if (!isNaN(nm) && nm < 5) return false;
        return true;
      });
    }

    if (appliedSearch) {
      const q = normalize(appliedSearch);
      result = result.filter(item => {
        const fieldsToSearch = isCandidateOriented
          ? [item.poste_crm_key, item.fonction, item.pays_designation, item.ong, item.etat_designation, item.note_mission, item.note_contexte, item.note_warning, item.nb_candidats]
          : [item.nom_contact, item.prenom_contact, item.competences_candidat, item.langues_candidat, item.etat_designation, item.note_mission, item.note_contexte, item.note_warning, item.nb_postes];

        return fieldsToSearch.some(val => {
          if (typeof val === 'string' && normalize(val).includes(q)) return true;
          if (typeof val === 'number' && String(val).includes(q)) return true;
          return false;
        });
      });
    }

    for (const [key, activeValues] of Object.entries(filters)) {
      if (activeValues.length > 0) {
        result = result.filter(item => {
          const val = (item as any)[key];
          if (val === null || val === undefined) return false;
          return activeValues.some(av => String(val).includes(av));
        });
      }
    }

    const group1: Opportunity[] = [];
    const group2: Opportunity[] = [];
    const group3: Opportunity[] = [];

    for (const item of result) {
      if (item.etat_designation === 'Accepté') {
        group1.push(item);
      } else if (item.etat_designation === 'Mise en lien' || item.etat_designation === 'Accord de principe') {
        group2.push(item);
      } else {
        group3.push(item);
      }
    }

    const sortByNote = (a: Opportunity, b: Opportunity) => {
      const nmA = Number(a.note_mission) || -1;
      const nmB = Number(b.note_mission) || -1;
      return nmB - nmA;
    };

    group1.sort(sortByNote);
    group2.sort(sortByNote);
    group3.sort(sortByNote);

    if (group1.length > 0) {
      return [{ items: group1, highlighted: false }];
    }

    return [
      { items: group2, highlighted: true },
      { items: group3, highlighted: false },
    ].filter(g => g.items.length > 0);
  }, [items, showAll, appliedSearch, filters, isCandidateOriented, approvalFilter]);

  if (loading && !items.length) return <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" data-testid="loading-spinner" /></div>;

  return (
    <div className="space-y-4">
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" data-testid="error-message">{error}</p>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} data-testid="toggle-show-all" />
            <Label htmlFor="show-all" className="cursor-pointer">Tout afficher</Label>
          </div>
          <div className="w-full sm:w-auto">
            <ListSearch
              value={search}
              onChange={setSearch}
              onSubmit={() => setAppliedSearch(search)}
            />
          </div>
        </div>

        {mode === 'recruteur' && (
          <Button variant="outline" size="sm" disabled={recalculating} onClick={recalculateAll} data-testid="button-recalculate-all">
            <RefreshCw className={`mr-2 h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculer
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2" data-testid="compact-filter-area">
        <span className="text-sm font-medium text-muted-foreground mr-1">Filtres :</span>
        {isCandidateOriented ? (
          <>
            <div className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm">
              <span className="font-medium">État poste</span>
              <ColumnFilter columnKey="etat_poste_designation" endpoint="/opportunites/filtres" label="État poste" activeValues={filters['etat_poste_designation'] || []} onApply={(v) => applyFilter('etat_poste_designation', v)} />
            </div>
            <div className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm">
              <span className="font-medium">Domaine</span>
              <ColumnFilter columnKey="domaine_designation" endpoint="/opportunites/filtres" label="Domaine" activeValues={filters['domaine_designation'] || []} onApply={(v) => applyFilter('domaine_designation', v)} />
            </div>
            <div className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm">
              <span className="font-medium">Compétences</span>
              <ColumnFilter columnKey="competences_poste" endpoint="/opportunites/filtres" label="Compétences" activeValues={filters['competences_poste'] || []} onApply={(v) => applyFilter('competences_poste', v)} />
            </div>
            <div className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm">
              <span className="font-medium">Langues</span>
              <ColumnFilter columnKey="langues_poste" endpoint="/opportunites/filtres" label="Langues" activeValues={filters['langues_poste'] || []} onApply={(v) => applyFilter('langues_poste', v)} />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm">
              <span className="font-medium">État candidat</span>
              <ColumnFilter columnKey="etat_candidat_designation" endpoint="/opportunites/filtres" label="État candidat" activeValues={filters['etat_candidat_designation'] || []} onApply={(v) => applyFilter('etat_candidat_designation', v)} />
            </div>
            <div className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm">
              <span className="font-medium">Domaine</span>
              <ColumnFilter columnKey="domaines_candidat" endpoint="/opportunites/filtres" label="Domaine" activeValues={filters['domaines_candidat'] || []} onApply={(v) => applyFilter('domaines_candidat', v)} />
            </div>
            <div className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm">
              <span className="font-medium">Compétences</span>
              <ColumnFilter columnKey="competences_candidat" endpoint="/opportunites/filtres" label="Compétences" activeValues={filters['competences_candidat'] || []} onApply={(v) => applyFilter('competences_candidat', v)} />
            </div>
            <div className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm">
              <span className="font-medium">Langues</span>
              <ColumnFilter columnKey="langues_candidat" endpoint="/opportunites/filtres" label="Langues" activeValues={filters['langues_candidat'] || []} onApply={(v) => applyFilter('langues_candidat', v)} />
            </div>
          </>
        )}
      </div>

      <Card className="overflow-hidden">
        <Table className="min-w-[1000px] border-collapse" data-testid="opportunity-table">
          <TableHeader className="bg-muted/50">
            {isCandidateOriented ? (
              <TableRow>
                <TableHead className="font-semibold text-foreground whitespace-nowrap">ID poste</TableHead>
                <TableHead className="font-semibold text-foreground">Fonction</TableHead>
                <TableHead className="font-semibold text-foreground">Pays</TableHead>
                <TableHead className="font-semibold text-foreground">ONG</TableHead>
                <TableHead className="font-semibold text-foreground whitespace-nowrap">État</TableHead>
                <TableHead className="font-semibold text-foreground whitespace-nowrap"><Target className="mr-1 inline-block h-4 w-4 text-primary" />Mission</TableHead>
                <TableHead className="font-semibold text-foreground whitespace-nowrap"><Target className="mr-1 inline-block h-4 w-4 text-primary" />Contexte</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Alerte</TableHead>
                <TableHead className="font-semibold text-foreground text-center whitespace-nowrap">Nb candidats</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            ) : (
              <TableRow>
                <TableHead className="font-semibold text-foreground">Nom</TableHead>
                <TableHead className="font-semibold text-foreground">Prénom</TableHead>
                <TableHead className="font-semibold text-foreground">Compétences</TableHead>
                <TableHead className="font-semibold text-foreground">Langue(s)</TableHead>
                <TableHead className="font-semibold text-foreground whitespace-nowrap">État</TableHead>
                <TableHead className="font-semibold text-foreground whitespace-nowrap"><Target className="mr-1 inline-block h-4 w-4 text-primary" />Mission</TableHead>
                <TableHead className="font-semibold text-foreground whitespace-nowrap"><Target className="mr-1 inline-block h-4 w-4 text-primary" />Contexte</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Alerte</TableHead>
                <TableHead className="font-semibold text-foreground text-center whitespace-nowrap">Nb postes</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            )}
          </TableHeader>

          {groups.map((group, groupIdx) => (
            <TableBody
              key={groupIdx}
              className={
                groupIdx < groups.length - 1
                  ? 'border-b-4 border-muted'
                  : ''
              }
            >
              {group.items.map((item) => {
                const detailPath = `/${mode}/opportunites/${item.id_opportunite}`;
                const rowClass = `${group.highlighted ? 'bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-950/20 dark:hover:bg-amber-900/30' : ''} ${item.flag_opportunite_obsolete ? 'opacity-60' : ''}`;

                const navigate = () => setLocation(detailPath);

                return (
                  <TableRow
                    key={item.id_opportunite}
                    className={`group cursor-pointer ${rowClass}`}
                    data-testid={`row-opportunity-${item.id_opportunite}`}
                    tabIndex={0}
                    role="button"
                    onClick={navigate}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate();
                      }
                    }}
                  >
                    {isCandidateOriented ? (
                      <>
                        <TableCell className="py-2.5 font-medium whitespace-nowrap">{item.poste_crm_key}</TableCell>
                        <TableCell className="py-2.5 max-w-[200px] truncate" title={item.fonction || ''}>{item.fonction || '—'}</TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap">{item.pays_designation}</TableCell>
                        <TableCell className="py-2.5 max-w-[150px] truncate" title={item.ong || ''}>{item.ong || '—'}</TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap">
                          <Badge variant={item.etat_designation.includes('Rejet') || item.etat_designation.includes('Refus') ? 'destructive' : 'outline'}>
                            {item.etat_designation}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 font-semibold text-center">{item.note_mission ?? '—'}</TableCell>
                        <TableCell className="py-2.5 font-semibold text-center">{item.note_contexte ?? '—'}</TableCell>
                        <TableCell className="py-2.5 text-center flex justify-center"><WarningScore value={item.note_warning} className="h-5 w-5" /></TableCell>
                        <TableCell className="py-2.5 text-center text-muted-foreground">{item.nb_candidats}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="py-2.5 font-medium whitespace-nowrap">{item.nom_contact}</TableCell>
                        <TableCell className="py-2.5 font-medium whitespace-nowrap">{item.prenom_contact}</TableCell>
                        <TableCell className="py-2.5 max-w-[200px] truncate" title={item.competences_candidat || ''}>{item.competences_candidat || '—'}</TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap">{item.langues_candidat || '—'}</TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap">
                          <Badge variant={item.etat_designation.includes('Rejet') || item.etat_designation.includes('Refus') ? 'destructive' : 'outline'}>
                            {item.etat_designation}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 font-semibold text-center">{item.note_mission ?? '—'}</TableCell>
                        <TableCell className="py-2.5 font-semibold text-center">{item.note_contexte ?? '—'}</TableCell>
                        <TableCell className="py-2.5 text-center flex justify-center"><WarningScore value={item.note_warning} className="h-5 w-5" /></TableCell>
                        <TableCell className="py-2.5 text-center text-muted-foreground">{item.nb_postes}</TableCell>
                      </>
                    )}
                    <TableCell className="py-2.5 text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full group-hover:bg-muted group-hover:text-foreground" tabIndex={-1} data-testid={`link-detail-${item.id_opportunite}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          ))}
          {!groups.length && !loading && (
            <TableBody>
              <TableRow>
                <TableCell colSpan={isCandidateOriented ? 10 : 10} className="h-32 text-center text-muted-foreground">
                  Aucune opportunité ne correspond à ces critères.
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
      </Card>
    </div>
  );
}
