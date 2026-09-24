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

export type UserAccount = {
  id_user: number;
  nom: string;
  prenom: string;
  email: string;
  role_applicatif: 'ADMIN' | 'RECRUTEUR' | 'CM' | 'CANDIDAT';
  role_contact: string;
  active: boolean;
  invitation?: 'sent' | 'pending_smtp_configuration' | 'failed';
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

  setUtilisateurActif: async (id: number, active: boolean): Promise<UserAccount> => {
    const action = active ? 'reactiver' : 'desactiver';
    const { data } = await api.patch<UserAccount>(`/admin/utilisateurs/${id}/${action}`);
    return data;
  },
};
