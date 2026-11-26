'use client';

import Link from 'next/link';
import { LogIn, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        className={cn(
          buttonVariants({ variant: 'outline', size: 'lg' }),
          'shrink-0 rounded-full px-2 sm:px-4'
        )}
      >
        <LogIn aria-hidden='true' />
        <span className='hidden sm:inline'>Sign in</span>
      </Link>
    );
  }

  return (
    <button
      type='button'
      onClick={handleSignOut}
      aria-label={isSigningOut ? 'Signing out' : 'Sign out'}
      disabled={isSigningOut}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'lg' }),
        'shrink-0 rounded-full px-2 sm:px-4'
      )}
    >
      <LogOut aria-hidden='true' />
      <span className='hidden sm:inline'>
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </span>
    </button>
  );
}
