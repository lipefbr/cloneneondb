import { getCurrentUser } from '@/lib/auth';

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: 'Não autorizado', status: 401 };
  if (user.role !== 'admin') {
    return { user: null, error: 'Acesso negado — requer privilégios de admin', status: 403 };
  }
  return { user, error: null, status: 200 };
}
