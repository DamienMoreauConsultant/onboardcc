import React, { useMemo, useState } from 'react';
import { Check, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReferenceMultiSelect } from './ReferenceMultiSelect';
import type { ReferenceOption, VoeuxReferences } from '@/api/candidats';

type CompetenceValue = ReferenceOption & {
  id_competences?: number;
  id_competence?: number;
  niveau?: string | null;
  autre_competence?: string | null;
};

type Props = {
  value: CompetenceValue[];
  refs: VoeuxReferences;
  editable: boolean;
  onChange: (value: CompetenceValue[]) => void;
};

const levels = ['Débutant', 'Intermédiaire', 'Confirmé', 'Expert'];

function competenceId(item: CompetenceValue) {
  return item.id ?? item.id_competences ?? item.id_competence;
}

function domainId(item: CompetenceValue, refs: VoeuxReferences) {
  return item.id_domaine ?? refs.competences.find((option) => option.id === competenceId(item))?.id_domaine ?? null;
}

export function CompetencesProposees({ value, refs, editable, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selected, setSelected] = useState<CompetenceValue[]>([]);

  const grouped = useMemo(() => {
    return refs.domaines
      .map((domain) => ({
        domain,
        items: value.filter((item) => domainId(item, refs) === domain.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [refs, value]);

  const domainOptions = refs.domaines.filter((domain) =>
    refs.competences.some((competence) => competence.id_domaine === domain.id),
  );
  const competenceOptions = refs.competences.filter((competence) => competence.id_domaine === Number(selectedDomain));

  const startAdd = () => {
    setSelectedDomain('');
    setSelected([]);
    setStep(1);
    setOpen(true);
  };

  const startEdit = (id: number) => {
    setSelectedDomain(String(id));
    setSelected(value.filter((item) => domainId(item, refs) === id));
    setStep(2);
    setOpen(true);
  };

  const confirm = () => {
    const id = Number(selectedDomain);
    onChange([...value.filter((item) => domainId(item, refs) !== id), ...selected.map((item) => ({ ...item, id_domaine: id }))]);
    setOpen(false);
  };

  const removeDomain = (id: number) => {
    onChange(value.filter((item) => domainId(item, refs) !== id));
  };

  return (
    <div className="space-y-3">
      {grouped.length === 0 && !editable && <p className="text-sm text-muted-foreground">Aucune compétence proposée.</p>}
      {grouped.length > 0 && (
        <div className="overflow-x-auto rounded-lg border-2 border-black">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <caption className="sr-only">Compétences proposées par domaine et niveau</caption>
            <thead className="bg-muted/70 text-left text-xs font-semibold uppercase tracking-wide">
              <tr className="border-b-2 border-black">
                <th scope="col" className="w-[30%] border-r-2 border-black p-3">Domaine</th>
                <th scope="col" className="p-3">Compétences et niveau</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ domain, items }) => (
                items.map((item, index) => (
                  <tr key={competenceId(item)} className="border-b-2 border-black last:border-b-0">
                    {index === 0 && (
                      <th scope="rowgroup" rowSpan={items.length} className="align-top border-r-2 border-black bg-muted/30 p-3 text-left font-semibold">
                        <div className="flex items-start justify-between gap-2">
                          <span>{domain.label}</span>
                          {editable && (
                            <div className="flex shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Modifier ${domain.label}`} onClick={() => startEdit(domain.id)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`Supprimer ${domain.label}`} onClick={() => removeDomain(domain.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </th>
                    )}
                    <td className="border-b-2 border-black p-3 last:border-b-0">
                      <div className="flex items-center justify-between gap-3">
                        <span>{refs.competences.find((option) => option.id === competenceId(item))?.label ?? item.label}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{item.niveau || '—'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editable && (
        <Button variant="outline" onClick={startAdd}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter une compétence
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{step === 1 ? 'Choisir un domaine' : 'Choisir les compétences'}</DialogTitle>
            <DialogDescription>
              {step === 1 ? 'Les compétences disponibles seront filtrées par ce domaine.' : 'Sélectionnez une ou plusieurs compétences et précisez leur niveau.'}
            </DialogDescription>
          </DialogHeader>
          {step === 1 ? (
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un domaine" /></SelectTrigger>
              <SelectContent>
                {domainOptions.map((domain) => <SelectItem key={domain.id} value={String(domain.id)}>{domain.label}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <ReferenceMultiSelect
              options={competenceOptions}
              mode="competence"
              value={selected}
              onChange={setSelected}
              placeholder="Ajouter des compétences"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}><X className="mr-2 h-4 w-4" />Annuler</Button>
            {step === 1 ? (
              <Button disabled={!selectedDomain} onClick={() => setStep(2)}>Suivant <ChevronRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button disabled={selected.length === 0} onClick={confirm}><Check className="mr-2 h-4 w-4" />Valider</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}