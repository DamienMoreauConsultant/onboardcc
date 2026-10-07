import { api } from './client';

export type CmNotification = {
  id_notification: number;
  type_evenement: string;
  /** Libellé lisible de l'événement, construit par le serveur. */
  evenement: string;
  date_evenement: string;
  consulte: boolean;
  id_opportunite: number;
  poste_crm_key: string;
  poste_fonction: string | null;
  candidat_prenom: string | null;
  candidat_nom: string | null;
};

export type CmNotifications = { non_consultees: number; notifications: CmNotification[] };

export const notificationsApi = {
  list: async () => (await api.get<CmNotifications>('/notifications')).data,
  /** Marque la notification comme consultée et renvoie l'opportunité à ouvrir. */
  consult: async (id: number) => (await api.patch<{ id_opportunite: number }>(`/notifications/${id}/consulter`)).data,
};
