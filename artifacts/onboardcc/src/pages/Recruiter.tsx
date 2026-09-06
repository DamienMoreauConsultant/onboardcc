import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { recruteurApi, type RecruiterCockpit } from '@/api/recruteur';

export default function Recruiter() {
  const [cockpit, setCockpit] = useState<RecruiterCockpit>();
  const [error, setError] = useState('');

  useEffect(() => {
    void recruteurApi.cockpit()
      .then(setCockpit)
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Impossible de charger le cockpit recruteur.'));
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Cockpit Recruteur</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Suivez les candidatures en attente et les délais de réponse.</p>
      </div>

      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" data-testid="status-recruiter-cockpit-error">{error}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Attente affectation</CardTitle>
            <Clock3 className="h-5 w-5 text-primary opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground" data-testid="text-recruiter-ata">
              {cockpit ? cockpit.kpis.candidats_en_ata : error ? '—' : <Loader2 className="h-6 w-6 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Candidats au statut ATA</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Accord définitif</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground" data-testid="text-recruiter-acceptes">
              {cockpit ? cockpit.kpis.candidats_acceptes : error ? '—' : <Loader2 className="h-6 w-6 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Candidats au statut Accepté</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display"><AlertTriangle className="h-5 w-5 text-amber-600" />Délais dépassés</CardTitle>
          <CardDescription>Les alertes sont recalculées à partir de l’entrée dans l’état actuel du candidat.</CardDescription>
        </CardHeader>
        <CardContent>
          {!cockpit && !error ? (
            <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !cockpit || cockpit.alertes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun délai de réponse dépassé.</p>
          ) : (
            <div className="space-y-3">
              {cockpit.alertes.map((alerte) => (
                <div key={alerte.id_candidat} className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-4 text-sm dark:bg-amber-950/10">
                  <p className="font-medium text-foreground">{[alerte.prenom, alerte.nom].filter(Boolean).join(' ') || `Candidat #${alerte.id_candidat}`}</p>
                  <p className="mt-1 text-muted-foreground">Toujours « {alerte.etat} » depuis {alerte.jours_ecoules} jours (délai autorisé : {alerte.delais_de_reponse} jours).</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
