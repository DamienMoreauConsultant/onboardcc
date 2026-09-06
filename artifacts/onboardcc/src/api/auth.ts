import { api } from './client';

// Types alignés sur la réponse du backend (routes/auth.ts)
export type SessionUser = {
  role_applicatif: 'ADMIN' | 'RECRUTEUR' | 'CM' | 'CANDIDAT';
  role_contact: 'ADMIN' | 'REC' | 'CHZ' | 'CM1' | 'CM2' | 'CAN' | 'MIS' | 'PAR';
  id_contact: number;
  id_candidat: number | null;
  nom: string;
  prenom: string;
};

export type LoginInput = {
  login: string;
  password: string;
};

export type ChangerPasswordInput = {
  ancien_password: string;
  nouveau_password: string;
};

export const authApi = {
  login: async (credentials: LoginInput): Promise<SessionUser> => {
    const { data } = await api.post<SessionUser>('/auth/login', credentials);
    return data;
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  
  getMe: async (): Promise<SessionUser> => {
    const { data } = await api.get<SessionUser>('/auth/me');
    return data;
  },
  
  changerPassword: async (input: ChangerPasswordInput): Promise<void> => {
    await api.post('/auth/changer-password', input);
  },

  forgotPassword: async (login: string): Promise<string> => {
    const { data } = await api.post<{message:string}>('/auth/mot-de-passe-oublie', {login});
    return data.message;
  },

  resetPassword: async (token: string, nouveau_password: string): Promise<string> => {
    const { data } = await api.post<{message:string}>('/auth/reinitialiser-password', {token,nouveau_password});
    return data.message;
  },
};
