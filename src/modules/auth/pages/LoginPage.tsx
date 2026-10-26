import { useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { AuthLayout } from '@/shared/components/layout/AuthLayout';
import { useSession } from '@/shared/hooks/usePermission';
import { LoginForm } from '../components/LoginForm';

export const LoginPage = () => {
  const session = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

  useEffect(() => {
    document.title = 'Kirish — Oq Tabassum Dental';
  }, []);

  if (session) return <Navigate to={target} replace />;

  return (
    <AuthLayout>
      <LoginForm onSuccess={() => navigate(target, { replace: true })} />
    </AuthLayout>
  );
};
