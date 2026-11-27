'use client';

import Link from 'next/link';
import { LogIn, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

export function HomepageAuthActions() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await authClient.signOut();
    if (error) {
      setIsSigningOut(false);
      toast.error(error.message ?? 'Unable to sign out. Please try again.');
      return;
    }

    router.refresh();
  };

  if (isPending) {
    return <span aria-hidden='true' className='size-8 shrink-0' />;
  }

  if (!session) {
    return (
      <Link
        href='/login'
        aria-label='Sign in'
        className='inline-flex h-10 shrink-0 items-center gap-2 text-sm font-semibold text-[#090f24] transition-colors hover:text-[#135858]'
      >
        <LogIn aria-hidden='true' className='size-4 sm:hidden' />
        <span className='hidden sm:inline'>Log In</span>
      </Link>
    );
  }

  return (
    <button
      type='button'
      onClick={handleSignOut}
      aria-label={isSigningOut ? 'Signing out' : 'Sign out'}
      disabled={isSigningOut}
      className='inline-flex h-10 shrink-0 items-center gap-2 text-sm font-semibold text-[#090f24] transition-colors hover:text-[#135858] disabled:opacity-60'
    >
      <LogOut aria-hidden='true' className='size-4 sm:hidden' />
      <span className='hidden sm:inline'>
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </span>
    </button>
  );
}
