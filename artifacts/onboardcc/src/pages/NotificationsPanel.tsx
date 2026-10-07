import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Bell, Loader2 } from 'lucide-react';
import { notificationsApi, type CmNotifications } from '@/api/notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

/**
 * Tableau « Dernières notifications » en bas de l'accueil du chargé de mission (UAT-06). Les lignes non
 * consultées sont en gras avec une pastille ; un clic marque la notification comme consultée et ouvre
 * l'opportunité concernée. Les notifications sont conservées 90 jours.
 */
export function NotificationsPanel() {
  const [data, setData] = useState<CmNotifications>();
  const [error, setError] = useState('');
  const [, navigate] = useLocation();

  useEffect(() => {
    void notificationsApi.list()
      .then(setData)
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Impossible de charger les notifications.'));
  }, []);

  const open = async (id: number) => {
    try {
      const { id_opportunite } = await notificationsApi.consult(id);
      navigate(`/cm/opportunites/${id_opportunite}`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Impossible d’ouvrir cette notification.');
    }
  };

  return (
    <Card className="shadow-sm" data-testid="panel-notifications">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Bell className="h-5 w-5 text-primary" />
          Dernières notifications
          {data && data.non_consultees > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground" data-testid="badge-notifications-non-lues">{data.non_consultees} nouvelle(s)</span>
          )}
        </CardTitle>
        <CardDescription>Événements sur les postes dont vous avez la charge, conservés 90 jours. Cliquez sur une ligne pour ouvrir l’opportunité.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {!data && !error ? (
          <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !data || data.notifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground" data-testid="empty-notifications">Aucune notification pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-4 py-2" aria-label="Non consultée" />
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Événement</th>
                  <th className="py-2">Opportunité</th>
                </tr>
              </thead>
              <tbody>
                {data.notifications.map((notification) => (
                  <tr
                    key={notification.id_notification}
                    onClick={() => void open(notification.id_notification)}
                    onKeyDown={(event) => { if (event.key === 'Enter') void open(notification.id_notification); }}
                    tabIndex={0}
                    role="link"
                    className={`cursor-pointer border-b last:border-0 hover:bg-muted/50 focus:bg-muted/50 focus:outline-none ${notification.consulte ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}
                    data-testid={`row-notification-${notification.id_notification}`}
                  >
                    <td className="py-2">{!notification.consulte && <span className="block h-2.5 w-2.5 rounded-full bg-primary" aria-label="Non consultée" />}</td>
                    <td className="whitespace-nowrap py-2 pr-4">{formatDateTime(notification.date_evenement)}</td>
                    <td className="py-2 pr-4">{notification.evenement}</td>
                    <td className="py-2">{notification.poste_crm_key}{notification.poste_fonction ? ` — ${notification.poste_fonction}` : ''} · {[notification.candidat_prenom, notification.candidat_nom].filter(Boolean).join(' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
