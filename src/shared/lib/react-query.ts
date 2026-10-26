import { QueryCache, QueryClient } from '@tanstack/react-query';
import { isApiError } from './mock/mockRequest';

let onUnauthorized: () => void = () => undefined;

/** 401 bo'lsa sessiyani tozalash (AppProvider ulaydi) */
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isApiError(error) && error.status === 401) onUnauthorized();
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => !(isApiError(error) && error.status < 500) && count < 1,
    },
    mutations: { retry: false },
  },
});

type ModuleKey = readonly [string];

/** Mutation'dan keyin bir nechta modul query'larini yangilash */
export const invalidate = (...keys: ModuleKey[]) =>
  Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
