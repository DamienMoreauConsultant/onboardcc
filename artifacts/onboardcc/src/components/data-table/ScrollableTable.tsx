import React from 'react';

export function ScrollableTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[20rem] max-h-[calc(100vh-21rem)] overflow-auto">
      {children}
    </div>
  );
}

export const stickyTableHeaderClass = 'sticky top-0 z-30 bg-muted text-left text-xs uppercase text-muted-foreground shadow-[0_1px_0_hsl(var(--border))]';