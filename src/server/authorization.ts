import 'server-only';

import { unauthorized } from 'next/navigation';
import { isAuthenticated } from '@/server/user';

export async function requireAdmin() {
  const session = await isAuthenticated();

  if (!session || session.user.role !== 'admin') {
    unauthorized();
  }

  return session.user;
}
