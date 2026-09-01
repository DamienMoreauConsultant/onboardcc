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
  flag_poste_deja_mis_en_lien: boolean;
};
export type PosteContact = {
  id_contact: number;
  crm_key: string;
  nom: string | null;
  prenom: string | null;
  role: string;
  telephone?: string | null;
  email?: string | null;
  adresse1?: string | null;
  adresse2?: string | null;
  code_postal?: string | null;
  ville?: string | null;
};
export type PosteDetail = PosteRow & {
  etat_designation: string;
  domaine_designation: string;
  billet_avion_designation?: string | null;
  contacts_json?: PosteContact[] | null;
  [key: string]: any;
};
export type ImportLine = { ligne: number; statut: 'ok' | 'erreur'; message: string };

export const postesApi = {
  list: async (filters: Record<string, string[]> = {}) => {
    const { data } = await api.get<PosteRow[]>('/postes', { params: { filtres: JSON.stringify(filters) } });
    return data;
  },
  states: async () => (await api.get<EtatPoste[]>('/postes/etats')).data,
  filterValues: async (column: string) => (await api.get<{ values: string[] }>(`/postes/filtres/${column}`)).data.values,
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