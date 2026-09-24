import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Link2, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { recruteurApi, type RecruiterCockpit } from '@/api/recruteur';

type KpiCardProps = {
  title: string;
  description: string;
  value: number | undefined;
  icon: typeof Send;
  testId: string;
  /** Page de liste ouverte au clic, déjà filtrée. */
  href: string;
};

function KpiCard({ title, description, value, icon: Icon, testId, href }: KpiCardProps) {
  return (
    <Link href={href} className="block h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" data-testid={`link-${testId}`}>
    <Card className="h-full cursor-pointer border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary opacity-70" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-display font-bold text-foreground" data-testid={`text-${testId}`}>
          {value === undefined ? <Loader2 className="h-6 w-6 animate-spin" /> : value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        <p className="mt-2 text-xs font-medium text-primary">Voir la liste →</p>
      </CardContent>
    </Card>
    </Link>
  );
}

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Candidats à inviter en session Choisir"
          description="En 2ème appel téléphonique, vœux soumis"
          value={cockpit?.kpis.candidats_a_inviter_session_choisir}
          icon={Send}
          testId="recruiter-a-inviter-session-choisir"
          href={`/recruteur/candidats?etat=${encodeURIComponent('2ème appel — À passer en Session choisir')}`}
        />
        <KpiCard
          title="Candidats à qualifier"
          description="Au moins une opportunité Non qualifié"
          value={cockpit?.kpis.candidats_a_qualifier}
          icon={ClipboardCheck}
          testId="recruiter-a-qualifier"
          href={`/recruteur/candidats?suivi=${encodeURIComponent('À qualifier')}`}
        />
        <KpiCard
          title="Candidats à mettre en lien"
          description="Opportunité approuvée, pas encore mis en lien"
          value={cockpit?.kpis.candidats_a_mettre_en_lien}
          icon={Link2}
          testId="recruiter-a-mettre-en-lien"
          href={`/recruteur/candidats?suivi=${encodeURIComponent('À mettre en lien')}`}
        />
        <KpiCard
          title="Candidats à affecter"
          description="Au moins une opportunité Acceptée"
          value={cockpit?.kpis.candidats_a_affecter}
          icon={CheckCircle2}
          testId="recruiter-a-affecter"
          href={`/recruteur/candidats?suivi=${encodeURIComponent('À affecter')}`}
        />
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
