import { api } from './client';

export type RecruiterCockpit = {
  kpis: {
    candidats_en_ata: number;
    candidats_acceptes: number;
  };
  alertes: Array<{
    id_candidat: number;
    prenom: string | null;
    nom: string | null;
    etat: string;
    date_entree_etat: string;
    delais_de_reponse: number;
    jours_ecoules: number;
  }>;
};

export const recruteurApi = {
  cockpit: async () => (await api.get<RecruiterCockpit>('/recruteur/cockpit')).data,
};