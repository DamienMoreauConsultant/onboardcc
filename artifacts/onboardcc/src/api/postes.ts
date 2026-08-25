import { api } from './client';

export type EtatPoste = { id_etat_poste: number; designation: string };
export type PosteRow = {
  id_poste: number;
  crm_key: string;
  statut_volontaire: string | null;
  fonction: string | null;
  etat_designation: string;
  pays_designation: string;
  opp_a_qualifier: number;
  opp_approuvee: number;
  opp_en_affectation: number;
};
export type PosteDetail = PosteRow & Record<string, any>;
export type ImportLine = { ligne: number; statut: 'ok' | 'erreur'; message: string };

export const postesApi = {
  list: async (etats?: string[]) => {
    const params = etats !== undefined ? { etats: etats.join(',') } : undefined;
    const { data } = await api.get<PosteRow[]>('/postes', { params });
    return data;
  },
  states: async () => (await api.get<EtatPoste[]>('/postes/etats')).data,
  detail: async (id: number) => (await api.get<PosteDetail>(`/postes/${id}`)).data,
  verifyImport: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return (await api.post<{ lignes: ImportLine[] }>('/postes/import/verifier', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
  executeImport: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return (await api.post<{ message: string; nb_postes: number; ids_postes: number[] }>(
      '/postes/import/executer', form, { headers: { 'Content-Type': 'multipart/form-data' } },
    )).data;
  },
  close: async (id: number, commentaire: string, files: File[]) => {
    const form = new FormData();
    form.append('commentaire', commentaire);
    files.slice(0, 2).forEach((file) => form.append('pieces_jointes', file));
    return (await api.patch(`/postes/${id}/fermer`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
  reopen: async (id: number, commentaire: string, files: File[]) => {
    const form = new FormData();
    form.append('commentaire', commentaire);
    files.slice(0, 2).forEach((file) => form.append('pieces_jointes', file));
    return (await api.patch(`/postes/${id}/reouvrir`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
};