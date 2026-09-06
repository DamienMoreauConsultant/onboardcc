import { api } from './client';

export type OpportunityState =
  | 'Provisoire'
  | 'Non qualifié'
  | 'Rejeté système'
  | 'Proposée au CM'
  | 'Approuvé CM'
  | 'Mise en lien'
  | 'Accord de principe'
  | 'Accepté'
  | 'Affecté'
  | 'Rejeté recruteur'
  | 'Rejeté CM'
  | 'Refus candidat'
  | 'Refus partenaire'
  | 'Rejet après affectation'
  | 'Obsolète';

export type Opportunity = {
  id_opportunite: number;
  id_poste: number;
  id_candidat: number;
  note_contexte: number | string | null;
  note_mission: number | string | null;
  note_warning: number | string | null;
  etat_designation: OpportunityState;
  nom_contact: string;
  prenom_contact: string;
  poste_crm_key: string;
  ong: string | null;
  fonction: string | null;
  pays_designation: string;
  region_designation: string;
  date_naissance: string | null;
  date_depart_possible: string | null;
  etat_poste_designation: string;
  etat_candidat_designation: string;
  etat_candidat_code: string;
  domaine_designation: string;
  domaines_poste: string | null;
  competences_poste: string | null;
  langues_poste: string | null;
  domaines_candidat: string | null;
  competences_candidat: string | null;
  langues_candidat: string | null;
  nb_candidats: number;
  nb_postes: number;
  commentaire_candidat?: string | null;
  commentaire_validation_recruteur?: string | null;
  appreciation_recruteur?: string | null;
  commentaire_charge_mission?: string | null;
  flag_opportunite_obsolete: boolean;
  flag_opportunite_non_retenu: boolean;
};

export type OpportunityDetail = Opportunity & {
  date_arrivee_souhaitee: string | null;
  contexte_mission: string | null;
  objectifs_mission: string | null;
  taches: string | null;
  competences_detail: string | null;
  odd_lie: string | null;
  dimension_ecclesial: string | null;
  cm_contact_json: {
    nom: string | null;
    prenom: string | null;
    telephone: string | null;
    email: string | null;
  } | null;
  criteres_detailles: Array<{
    id_criteres_detailles: number;
    date_evaluation: string;
    critere: string;
    valeur_poste: string | null;
    valeur_candidat: string | null;
    note_obtenue: number | string;
  }>;
};

export type OpportunityAction =
  | 'proposer-cm'
  | 'approuver'
  | 'rejeter-cm'
  | 'rejeter-recruteur'
  | 'mettre-en-lien'
  | 'accord-de-principe'
  | 'accord-definitif'
  | 'decision-dcc'
  | 'refuser-candidat'
  | 'refuser-partenaire'
  | 'annuler-affectation';

export const opportunitesApi = {
  list: async (filters: { id_poste?: number; id_candidat?: number; approbation?: 'proposee-au-cm' | 'proposee-au-cm-historique' }) =>
    (await api.get<Opportunity[]>('/opportunites', { params: filters })).data,
  detail: async (id: number) =>
    (await api.get<OpportunityDetail>(`/opportunites/${id}`)).data,
  transition: async (id: number, action: OpportunityAction, commentaire: string) =>
    (await api.post(`/opportunites/${id}/${action}`, { commentaire })).data,
  recalculate: async (id: number) =>
    (await api.post(`/opportunites/${id}/recalculer`)).data,
  recalculateList: async (filters: { id_poste?: number; id_candidat?: number }) =>
    (await api.post<{recalcules:number}>(`/opportunites/recalculer-liste`, filters)).data,
};