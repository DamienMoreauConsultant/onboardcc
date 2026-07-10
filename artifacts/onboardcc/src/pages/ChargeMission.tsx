import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Globe2, Building2 } from 'lucide-react';

export default function ChargeMission() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Tableau de bord Missions</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Suivi des fiches de poste, des opportunités et des partenariats ONG.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Postes à pourvoir</CardTitle>
            <Briefcase className="h-5 w-5 text-primary opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">87</div>
            <p className="text-xs text-muted-foreground mt-1">Dont 14 urgents</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Opportunités en cours</CardTitle>
            <Globe2 className="h-5 w-5 text-accent opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">32</div>
            <p className="text-xs text-muted-foreground mt-1">Matching candidats</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-sidebar-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Partenaires Actifs</CardTitle>
            <Building2 className="h-5 w-5 text-sidebar-accent opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">145</div>
            <p className="text-xs text-muted-foreground mt-1">Dans 38 pays</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-display">Derniers postes validés</CardTitle>
          <CardDescription>Les fiches de poste récemment approuvées prêtes pour la recherche de candidats.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-center py-12 text-muted-foreground">
            {/* TODO: Wire up actual postes API when available */}
            <p>La liste complète sera connectée à l'API prochainement.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
