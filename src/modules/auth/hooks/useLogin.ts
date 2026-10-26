import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import type { LoginPayload } from '../types';

export const useLogin = () => {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (session, payload) => setSession(session, payload.remember),
  });
};
