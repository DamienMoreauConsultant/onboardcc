import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Circle, GraduationCap, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Candidate() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="bg-primary text-primary-foreground rounded-2xl p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-bold mb-2">Bienvenue, {user?.prenom}</h1>
          <p className="text-primary-foreground/80 max-w-xl">
            Votre parcours d'engagement avec la Délégation Catholique pour la Coopération commence ici. Suivez l'avancement de votre dossier et vos prochaines étapes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-display">Votre parcours</CardTitle>
              <CardDescription>Les grandes étapes de votre préparation au départ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
                <div>
                  <h3 className="font-semibold text-foreground">Candidature validée</h3>
                  <p className="text-sm text-muted-foreground mt-1">Votre dossier a été examiné et validé par notre équipe.</p>
                </div>
              </div>
              
              <div className="flex gap-4 relative">
                <div className="absolute left-3 top-[-16px] bottom-[-16px] w-px bg-border -z-10" />
                <div className="mt-1"><CheckCircle2 className="h-6 w-6 text-green-600 bg-card" /></div>
                <div>
                  <h3 className="font-semibold text-foreground">Entretien d'orientation</h3>
                  <p className="text-sm text-muted-foreground mt-1">Vous avez rencontré votre chargé d'orientation.</p>
                </div>
              </div>

              <div className="flex gap-4 relative">
                <div className="absolute left-3 top-[-16px] bottom-[-16px] w-px bg-border -z-10" />
                <div className="mt-1"><Circle className="h-6 w-6 text-accent fill-accent/20 bg-card" /></div>
                <div>
                  <h3 className="font-semibold text-foreground">Session de formation</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">Participation obligatoire avant proposition de mission.</p>
                  <Button className="font-semibold text-sm">S'inscrire à une session</Button>
                </div>
              </div>

              <div className="flex gap-4 relative opacity-50">
                <div className="absolute left-3 top-[-16px] bottom-[-16px] w-px bg-border -z-10" />
                <div className="mt-1"><Circle className="h-6 w-6 text-muted-foreground bg-card" /></div>
                <div>
                  <h3 className="font-semibold text-foreground">Proposition de mission</h3>
                  <p className="text-sm text-muted-foreground mt-1">Étude des correspondances avec nos offres.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm bg-accent/5 border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-accent" />
                Formation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                La formation au départ est une étape clé de votre préparation. Elle permet d'aborder l'interculturalité, la vie d'équipe et le sens de la mission.
              </p>
              <a href="#" className="text-sm font-semibold text-primary hover:underline">Découvrir le programme &rarr;</a>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                Vos préférences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Disponibilité</span>
                  <span className="font-medium">À partir de Septembre</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Durée souhaitée</span>
                  <span className="font-medium">1 à 2 ans</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domaines</span>
                  <span className="font-medium text-right">Enseignement, Santé</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
