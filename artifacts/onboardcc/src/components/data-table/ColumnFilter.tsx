import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter, Loader2, Search } from 'lucide-react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

type Props = {
  columnKey: string;
  endpoint: string;
  label: string;
  activeValues: string[];
  onApply: (values: string[]) => void;
};

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr');

export function ColumnFilter({ columnKey, endpoint, label, activeValues, onApply }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>(activeValues);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popupRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (open) setDraft(activeValues);
  }, [activeValues, open]);

  const visibleValues = useMemo(() => {
    if (values.length >= 20 && query.trim().length < 3) return [];
    const needle = normalize(query.trim());
    return needle ? values.filter((value) => normalize(value).includes(needle)) : values;
  }, [query, values]);

  const show = async () => {
    const nextOpen = !open;
    if (nextOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 288;
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(Math.max(8, rect.right - popupWidth), window.innerWidth - popupWidth - 8),
      });
    }
    setOpen(nextOpen);
    if (!nextOpen || values.length) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ values: string[] }>(`${endpoint}/${columnKey}`);
      setValues(data.values);
      setError('');
    } catch {
      setError('Valeurs indisponibles.');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (value: string) => setDraft((current) =>
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const allVisibleSelected = visibleValues.length > 0 && visibleValues.every((value) => draft.includes(value));
  const toggleVisible = () => setDraft((current) => allVisibleSelected
    ? current.filter((value) => !visibleValues.includes(value))
    : Array.from(new Set([...current, ...visibleValues])));

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Filtrer la colonne ${label}`}
        aria-pressed={activeValues.length > 0}
        className={`relative ml-1 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-primary/10 hover:text-primary ${activeValues.length ? 'bg-primary/10 text-primary' : ''}`}
        onClick={() => void show()}
      >
        <Filter className="h-3.5 w-3.5" />
        {activeValues.length > 0 && <span className="absolute -right-1 -top-1 min-w-3 rounded-full bg-primary px-1 text-[9px] leading-3 text-primary-foreground">{activeValues.length}</span>}
      </button>
      {open && createPortal(
        <div ref={popupRef} style={position} className="fixed z-[100] w-72 rounded-lg border bg-popover p-3 text-popover-foreground shadow-xl">
          <label className="relative block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher…"
              className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm font-normal normal-case outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <div className="mt-2 max-h-56 overflow-y-auto rounded-md border">
            {loading && <div className="flex justify-center p-6"><Loader2 className="h-4 w-4 animate-spin" /></div>}
            {!loading && error && <p className="p-3 text-xs normal-case text-destructive">{error}</p>}
            {!loading && !error && values.length >= 20 && query.trim().length < 3 && (
              <p className="p-3 text-xs font-normal normal-case text-muted-foreground">Saisissez au moins 3 caractères pour afficher les valeurs.</p>
            )}
            {!loading && !error && (values.length < 20 || query.trim().length >= 3) && (
              <>
                <button type="button" className="w-full border-b px-3 py-2 text-left text-xs font-medium normal-case text-primary hover:bg-muted" onClick={toggleVisible}>
                  {allVisibleSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                {visibleValues.map((value) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-normal normal-case hover:bg-muted">
                    <Checkbox checked={draft.includes(value)} onCheckedChange={() => toggle(value)} />
                    <span className="min-w-0 break-words">{value}</span>
                  </label>
                ))}
                {!visibleValues.length && <p className="p-3 text-xs font-normal normal-case text-muted-foreground">Aucune valeur correspondante.</p>}
              </>
            )}
          </div>
          <div className="mt-3 flex justify-between gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => { onApply([]); setDraft([]); setOpen(false); }}>Réinitialiser</Button>
            <Button type="button" size="sm" onClick={() => { onApply(draft); setOpen(false); }}>Appliquer</Button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}