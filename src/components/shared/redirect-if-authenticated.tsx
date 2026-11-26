import { isAuthenticated } from '@/server/user';
import { redirect } from 'next/navigation';

export async function RedirectIfAuthenticated({
  redirectTo = '/'
}: {
  redirectTo?: string;
}) {
  const session = await isAuthenticated();

  if (session) {
    redirect(redirectTo);
  }

  return null;
}
