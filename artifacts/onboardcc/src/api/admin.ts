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
};
