import { type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export function ListSearch({ value, onChange, onSubmit, loading = false }: Props) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="flex w-full max-w-md items-center gap-2" onSubmit={submit} role="search">
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Rechercher..."
        aria-label="Rechercher dans la liste"
      />
      <Button
        type="submit"
        size="icon"
        variant="outline"
        disabled={loading}
        aria-label="Lancer la recherche"
        title="Rechercher"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}