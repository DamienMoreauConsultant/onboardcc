import { api } from './client';

export type RecruiterCockpit = {
  kpis: {
    candidats_a_inviter_session_choisir: number;
    candidats_a_qualifier: number;
    candidats_a_mettre_en_lien: number;
    candidats_a_affecter: number;
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