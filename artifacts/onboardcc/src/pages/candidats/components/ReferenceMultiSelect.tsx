import React, { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Option = { id: number; label: string };

type Props = {
  options: Option[];
  value: any[];
  onChange: (val: any[]) => void;
  mode?: 'simple' | 'langue' | 'competence' | 'region';
  levelOptions?: Option[];
  placeholder?: string;
  disabled?: boolean;
};

export function ReferenceMultiSelect({ options = [], value = [], onChange, mode = 'simple', levelOptions = [], placeholder = 'Sélectionner...', disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const itemId = (item: any) => mode === 'simple'
    ? item.id ?? item.id_domaine ?? item.id_duree ?? item.id_environnement ?? item.id_hebergement
    : mode === 'langue'
      ? item.id_langue
      : mode === 'competence'
        ? item.id_competences ?? item.id_competence
        : item.id_region;

  const add = (opt: Option) => {
    if (mode === 'simple') {
      if (!value.find(v => itemId(v) === opt.id)) {
        onChange([...value, { id: opt.id }]);
      }
    } else if (mode === 'langue') {
      if (!value.find(v => itemId(v) === opt.id)) {
        onChange([...value, { id_langue: opt.id, niveau: levelOptions[0]?.label ?? '' }]);
      }
    } else if (mode === 'competence') {
      if (!value.find(v => itemId(v) === opt.id)) {
        onChange([...value, { id_competences: opt.id, niveau: 'Débutant' }]);
      }
    } else if (mode === 'region') {
      if (!value.find(v => itemId(v) === opt.id)) {
        onChange([...value, { id_region: opt.id, degre: 'Non' }]);
      }
    }
  };

  const remove = (idToRemove: number) => {
    onChange(value.filter(v => itemId(v) !== idToRemove));
  };

  const updateLevel = (id: number, newVal: any) => {
    if (mode === 'langue' || mode === 'competence') onChange(value.map(v => itemId(v) === id ? { ...v, niveau: newVal } : v));
    else if (mode === 'region') onChange(value.map(v => itemId(v) === id ? { ...v, degre: newVal } : v));
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between bg-background" disabled={disabled}>
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher..." />
            <CommandList>
              <CommandEmpty>Aucun résultat.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isSelected = value.some(v => itemId(v) === opt.id);
                  return (
                    <CommandItem key={opt.id} value={opt.label} onSelect={() => { add(opt); setOpen(false); }}>
                      <Check className={`mr-2 h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                      {opt.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((v, i) => {
            const id = itemId(v);
            const opt = options.find(o => o.id === id);
            if (!opt) return null;

            return (
              <div key={id || i} className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                <span className="flex-1 text-sm">{opt.label}</span>
                
                {mode === 'langue' && (
                  <Select value={String(v.niveau ?? '')} onValueChange={(val) => updateLevel(id, val)} disabled={disabled}>
                    <SelectTrigger className="w-[140px] h-8 bg-background">
                      <SelectValue placeholder="Niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map(l => (
                        <SelectItem key={l.id} value={l.label}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {mode === 'competence' && (
                  <Select value={v.niveau} onValueChange={(val) => updateLevel(id, val)} disabled={disabled}>
                    <SelectTrigger className="w-[140px] h-8 bg-background">
                      <SelectValue placeholder="Niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Débutant">Débutant</SelectItem>
                      <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                      <SelectItem value="Confirmé">Confirmé</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {mode === 'region' && (
                  <Select value={v.degre ?? 'Non'} onValueChange={(val) => updateLevel(id, val)} disabled={disabled}>
                    <SelectTrigger className="w-[180px] h-8 bg-background">
                      <SelectValue placeholder="Volonté" />
                    </SelectTrigger>
                    <SelectContent>
                      {['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'Non'].map((degree) => (
                        <SelectItem key={degree} value={degree}>{degree}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {!disabled && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
