import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  value: boolean | undefined | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function BooleanControl({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant={value === true ? 'default' : 'outline'}
        onClick={() => onChange(true)}
        disabled={disabled}
      >
        Oui
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === false ? 'default' : 'outline'}
        onClick={() => onChange(false)}
        disabled={disabled}
      >
        Non
      </Button>
    </div>
  );
}
