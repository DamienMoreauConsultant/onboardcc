import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { BriefcaseBusiness, CheckCircle2, History, Loader2 } from 'lucide-react';
import { postesApi, type CmDashboardKpis } from '@/api/postes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardCardProps = {
  title: string;
  description: string;
  value: number | undefined;
  href: string;
  icon: typeof BriefcaseBusiness;
  testId: string;
};

function DashboardCard({ title, description, value, href, icon: Icon, testId }: DashboardCardProps) {
  return (
    <Link href={href} className="block" data-testid={`link-${testId}`}>
      <Card className="h-full border-t-4 border-t-primary shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
          <Icon className="h-5 w-5 text-primary opacity-70" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-display font-bold text-foreground" data-testid={`text-${testId}`}>
            {value === undefined ? <Loader2 className="h-6 w-6 animate-spin" /> : value}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ChargeMission() {
  const [kpis, setKpis] = useState<CmDashboardKpis>();
  const [error, setError] = useState('');

  useEffect(() => {
    void postesApi.cmDashboardKpis()
      .then(setKpis)
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Impossible de charger les indicateurs.'));
  }, []);

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Tableau de bord Missions</h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">Suivi des postes et des opportunités relevant de vos missions.</p>
      </div>
      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" data-testid="status-dashboard-error">{error}</p>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DashboardCard
          title="Postes à pourvoir"
          description="Postes dont vous avez la charge"
          value={kpis?.postes_a_pourvoir}
          href="/cm/postes?etat=%C3%80%20pourvoir"
          icon={BriefcaseBusiness}
          testId="cm-postes-a-pourvoir"
        />
        <DashboardCard
          title="Opportunités à approuver"
          description="Actuellement proposées au CM"
          value={kpis?.opportunites_a_approuver}
          href="/cm/postes?opportunites=proposee-au-cm"
          icon={CheckCircle2}
          testId="cm-opportunites-a-approuver"
        />
        <DashboardCard
          title="Toutes mes opportunités à approuver"
          description="Opportunités proposées, y compris celles déjà traitées"
          value={kpis?.toutes_opportunites_a_approuver}
          href="/cm/postes?opportunites=proposee-au-cm-historique"
          icon={History}
          testId="cm-toutes-opportunites-a-approuver"
        />
      </div>
    </div>
  );
}