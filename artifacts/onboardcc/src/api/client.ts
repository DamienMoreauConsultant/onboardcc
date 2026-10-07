import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

/* Désactivation immédiate d'un compte (UAT-02 D6) : dès que le serveur répond 401 à une personne qui était
   connectée (compte désactivé, session expirée), on la ramène à l'écran de connexion. Les appels de connexion
   et de vérification de session (/auth/login, /auth/me) sont exclus : un 401 y est une réponse normale. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error?.config?.url ?? '';
    const normal = url.includes('/auth/login') || url.includes('/auth/me') || url.includes('/auth/mot-de-passe-oublie') || url.includes('/auth/reinitialiser-password');
    if (error?.response?.status === 401 && !normal && !window.location.pathname.endsWith('/login')) {
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);
