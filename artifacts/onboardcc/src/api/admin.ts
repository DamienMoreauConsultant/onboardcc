import { api } from './client';

// Ligne générée dynamiquement depuis la BDD — la forme exacte dépend de la table
export type ReferentielItem = Record<string, string | number | boolean | null>;

// Réponse du backend : { table, label, pk, rows }
// 'pk' est le nom de la colonne clé primaire de cette table (ex: 'id_region', 'id_pays', etc.)
export type ReferentielResponse = {
  table: string;
  label: string;
  pk: string;
  rows: ReferentielItem[];
};

export type InvitationStatus = 'sent' | 'pending_smtp_configuration' | 'failed';

export type UserAccount = {
  id_user: number;
  login: string;
  id_contact: number;
  crm_key: string | null;
  nom: string;
  prenom: string;
  email: string;
  role_applicatif: 'ADMIN' | 'RECRUTEUR' | 'CM' | 'CANDIDAT';
  role_contact: string;
  active: boolean;
  /** État du candidat (désignation) : renseigné uniquement pour les comptes CANDIDAT. */
  etat_designation?: string | null;
  etat_code?: string | null;
  invitation?: InvitationStatus;
};

/** Champs modifiables d'un compte : le rôle applicatif ne l'est jamais. nom, prénom et email seulement pour un contact Admin ou Recruteur (REC). */
export type UpdateUserAccountInput = Partial<{ login: string; active: boolean; nom: string; prenom: string; email: string }>;

export type EmailTemplate = {
  email_type: string;
  libelle: string;
  objet: string;
  contenu: string;
  frequence_heures: number;
  variables: string[];
  obligatoires: string[];
  groupable: boolean;
};

export type CreateUserAccountInput = {
  role_applicatif: 'ADMIN' | 'RECRUTEUR';
  role_contact: 'ADMIN' | 'REC' | 'CHZ';
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  genre: string;
};

export const adminApi = {
  getReferentiel: async (table: string): Promise<ReferentielResponse> => {
    const { data } = await api.get<ReferentielResponse>(`/admin/referentiels/${table}`);
    return data;
  },

  createReferentiel: async (table: string, payload: Record<string, unknown>): Promise<ReferentielItem> => {
    const { data } = await api.post<ReferentielItem>(`/admin/referentiels/${table}`, payload);
    return data;
  },

  updateReferentiel: async (table: string, id: number | string, payload: Record<string, unknown>): Promise<ReferentielItem> => {
    const { data } = await api.patch<ReferentielItem>(`/admin/referentiels/${table}/${id}`, payload);
    return data;
  },

  getUtilisateurs: async (): Promise<UserAccount[]> => {
    const { data } = await api.get<UserAccount[]>('/admin/utilisateurs');
    return data;
  },

  createUtilisateur: async (payload: CreateUserAccountInput): Promise<UserAccount> => {
    const { data } = await api.post<UserAccount>('/admin/utilisateurs', payload);
    return data;
  },

  updateUtilisateur: async (id: number, payload: UpdateUserAccountInput): Promise<UserAccount> => {
    const { data } = await api.patch<UserAccount>(`/admin/utilisateurs/${id}`, payload);
    return data;
  },

  /** Désactivation en masse (candidats et CM uniquement). */
  desactiverUtilisateurs: async (ids: number[]): Promise<{ desactives: number; deja_inactifs: number }> => {
    const { data } = await api.post<{ desactives: number; deja_inactifs: number }>('/admin/utilisateurs/desactiver', { ids });
    return data;
  },

  renvoyerInvitation: async (id: number): Promise<{ invitation: InvitationStatus }> => {
    const { data } = await api.post<{ invitation: InvitationStatus }>(`/admin/utilisateurs/${id}/renvoyer-invitation`);
    return data;
  },

  getModelesEmail: async (): Promise<{ smtp_configure: boolean; modeles: EmailTemplate[] }> => {
    const { data } = await api.get<{ smtp_configure: boolean; modeles: EmailTemplate[] }>('/admin/modeles-email');
    return data;
  },

  updateModeleEmail: async (type: string, payload: { objet: string; contenu: string; frequence_heures: number }): Promise<EmailTemplate> => {
    const { data } = await api.patch<EmailTemplate>(`/admin/modeles-email/${type}`, payload);
    return data;
  },

  testerModeleEmail: async (type: string, payload: { objet: string; contenu: string }): Promise<{ envoye_a: string }> => {
    const { data } = await api.post<{ envoye_a: string }>(`/admin/modeles-email/${type}/tester`, payload);
    return data;
  },
};
