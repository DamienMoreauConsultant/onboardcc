import { api } from './client';

export type EtatCandidat = { id_etat_candidat: number; designation: string; delais_de_reponse?: number | null };
export type ImportLine = { ligne: number; statut: 'ok' | 'erreur'; message: string };
export type CandidatRow = {
  id_candidat: number; nom_contact: string; prenom_contact: string; email_contact?: string;
  etat_designation: string; id_etat_candidat: number; date_revue?: string | null;
  domaines?: string | null; regions?: string | null; duree?: string | null; langues?: string | null;
  opportunites_a_qualifier?: number; opportunites_approuvees?: number; opportunites_affectation?: number;
  flag_candidat_deja_mis_en_lien?: boolean;
  alerte_revue?: boolean;
};
export type CandidatDetail = CandidatRow & Record<string, any>;
export type CandidatsPage = { items: CandidatRow[]; total: number; page: number; pageSize: number };
type CandidatsApiPage = { candidats: CandidatRow[]; total: number; page: number; page_size: number };
export type ReferenceOption = { id: number; label: string; id_domaine?: number | null };
export type VoeuxReferences = {
  durees: ReferenceOption[];
  environnements: ReferenceOption[];
  hebergements: ReferenceOption[];
  competences: ReferenceOption[];
  langues: ReferenceOption[];
  niveauxLangue: ReferenceOption[];
  regions: ReferenceOption[];
  domaines: ReferenceOption[];
  aides: Record<string, string>;
};

export const candidatsApi = {
  list: async (page = 1, filters: Record<string, string[]> = {}, search = '') => {
    const { data } = await api.get<CandidatRow[] | CandidatsApiPage>('/candidats', { params: { page, filtres: JSON.stringify(filters), recherche: search } });
    return Array.isArray(data)
      ? { items: data, total: data.length, page, pageSize: 20 }
      : { items: data.candidats, total: data.total, page: data.page, pageSize: data.page_size };
  },
  states: async () => (await api.get<EtatCandidat[]>('/candidats/etats')).data,
  filterValues: async (column: string) => (await api.get<{ values: string[] }>(`/candidats/filtres/${column}`)).data.values,
  voeuxReferences: async () => (await api.get<VoeuxReferences>('/candidats/referentiels/voeux')).data,
  detail: async (id: number) => {
    const { data } = await api.get<CandidatDetail>(`/candidats/${id}`);
    return { ...data, ...(data.adresse ?? {}), ...(data.fiche_de_voeux ?? {}) };
  },
  verifyImport: async (file: File) => {
    const form = new FormData(); form.append('file', file);
    return (await api.post<{ lignes: ImportLine[] }>('/candidats/import/verifier', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
  executeImport: async (file: File) => {
    const form = new FormData(); form.append('file', file);
    return (await api.post('/candidats/import/executer', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
  save: async (id: number, section: 'etat-civil' | 'projet' | 'voeux', values: Record<string, unknown>) => (await api.patch(`/candidats/${id}/${section}`, values)).data,
  transition: async (id: number, action: 'rejeter' | 'valider_appel2' | 'annulerCandidature' | 'valider_session_choisir', commentaire: string, attachments: {description?: string; files?: File[]} = {}) => {
    const form = new FormData();
    form.append('commentaire', commentaire);
    if (attachments.description) form.append('pj_description', attachments.description);
    attachments.files?.slice(0, 2).forEach((file) => form.append('pieces_jointes', file));
    return (await api.post(`/candidats/${id}/${action}`, form)).data;
  },
  reviseReviewDate: async (id: number, date_revue: string | null) => (await api.patch(`/candidats/${id}/date-revue`, { date_revue })).data,
  submitVoeux: async (id: number, definitive: boolean) => (await api.post(`/candidats/${id}/${definitive ? 'soumettre-voeux-definitifs' : 'soumettre-voeux-provisoire'}`)).data,
  attachmentConfiguration: async () => (await api.get<{storageUrl:string|null}>('/candidats/configuration/pieces-jointes')).data,
};