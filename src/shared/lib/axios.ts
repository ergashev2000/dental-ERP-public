import axios from 'axios';

/**
 * Real backend uchun HTTP klient. Hozir barcha modullar mock (`shared/lib/mock`) orqali ishlaydi;
 * backend tayyor bo'lganda faqat modullarning `api/*.ts` fayllari shu klientga o'tkaziladi.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 20_000,
});

let tokenGetter: () => string | null | undefined = () => null;
let onUnauthorized: () => void = () => undefined;

export const configureHttp = (opts: { getToken: typeof tokenGetter; onUnauthorized: () => void }) => {
  tokenGetter = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
};

http.interceptors.request.use((config) => {
  const token = tokenGetter();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) onUnauthorized();
    return Promise.reject(error);
  },
);
