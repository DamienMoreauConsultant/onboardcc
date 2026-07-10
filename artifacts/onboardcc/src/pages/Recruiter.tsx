import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Clock, CheckCircle } from 'lucide-react';

export default function Recruiter() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Pipeline Candidats</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Vue d'ensemble de l'entonnoir de recrutement et des actions requises.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Nouveaux</CardTitle>
            <UserPlus className="h-5 w-5 text-primary opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">24</div>
            <p className="text-xs text-muted-foreground mt-1">+3 depuis hier</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">En entretien</CardTitle>
            <Clock className="h-5 w-5 text-accent opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">18</div>
            <p className="text-xs text-muted-foreground mt-1">4 à planifier</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">En formation</CardTitle>
            <Users className="h-5 w-5 text-orange-500 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">42</div>
            <p className="text-xs text-muted-foreground mt-1">Session Session Automne</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Validés</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">Prêts pour le matching</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-display">Dernières candidatures</CardTitle>
          <CardDescription>Liste des candidats récemment inscrits nécessitant une action.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-center py-12 text-muted-foreground">
            {/* TODO: Wire up actual candidates API when available */}
            <p>La liste complète sera connectée à l'API prochainement.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
