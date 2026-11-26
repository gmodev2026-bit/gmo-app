'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangleIcon } from 'lucide-react';
import { Alert } from '@/components/ui/alert';

const signInSchema = z.object({
  email: z
    .email('Please enter a valid email address.')
    .min(1, 'Email is required.')
    .max(50, 'Email must be at most 50 characters.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(100, 'Password must be at most 100 characters.'),
  rememberMe: z.boolean().optional()
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null
  );

  type SignInValues = z.infer<typeof signInSchema>;

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const signInWithGoogle = async () => {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard/client'
      });
    } catch (error) {
      console.error('Google sign-in failed:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Google sign-in failed. Please try again.'
      );
    }
  };

  async function onSubmit({ email, password, rememberMe }: SignInValues) {
    setError(null);
    setVerificationMessage(null);
    setLoading(true);

    try {
      const { error, data } = await authClient.signIn.email({
        email,
        password,
        rememberMe
      });

      if (!data) {
        setError(error?.message || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      if (data.user.role === 'admin') {
        form.reset();
        toast.success('Welcome back, admin!');
        router.push('/admin');
      } else {
        form.reset();
        toast.success('Welcome back!');
        router.push('/dashboard/client');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendVerificationEmail() {
    const parsedEmail = signInSchema.shape.email.safeParse(
      form.getValues('email')
    );
    if (!parsedEmail.success) {
      setVerificationMessage('Enter a valid email address first.');
      return;
    }

    setIsResendingVerification(true);
    setVerificationMessage(null);
    try {
      const { error: resendError } = await authClient.sendVerificationEmail({
        email: parsedEmail.data,
        callbackURL: '/dashboard/client'
      });

      if (resendError) {
        setVerificationMessage(
          resendError.message ??
            'We could not request a verification email. Please try again later.'
        );
        return;
      }

      setVerificationMessage(
        'If this address has an unverified account, a new verification email has been requested. Check your inbox and spam folder.'
      );
    } catch (resendError) {
      setVerificationMessage(
        resendError instanceof Error
          ? resendError.message
          : 'We could not request a verification email. Please try again later.'
      );
    } finally {
      setIsResendingVerification(false);
    }
  }

  return (
    <div
      className={cn('flex w-full max-w-100 flex-col gap-6', className)}
      {...props}
    >
      {/* Header */}
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>Welcome back</h1>
        <p className='text-muted-foreground text-sm'>
          Enter your email below to login to your account
        </p>

        {error && (
          <Alert variant='destructive' className='mt-4 w-full'>
            <AlertTriangleIcon className='mr-2 h-4 w-4' />
            {error}
          </Alert>
        )}
        <div className='space-y-2'>
          <Button
            type='button'
            variant='outline'
            className='w-full'
            disabled={isResendingVerification}
            onClick={resendVerificationEmail}
          >
            {isResendingVerification ? (
              <Spinner />
            ) : (
              'Resend verification email'
            )}
          </Button>
          {verificationMessage && (
            <p
              className='text-muted-foreground text-center text-sm'
              role='status'
              aria-live='polite'
            >
              {verificationMessage}
            </p>
          )}
        </div>
      </div>

      {/* Main Form Area */}
      <div className='grid gap-6'>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Email Field */}
            <Controller
              name='email'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='email'>Email</FieldLabel>
                  <Input
                    {...field}
                    id='email'
                    type='email'
                    placeholder='name@example.com'
                    autoComplete='username'
                    spellCheck={false}
                    required
                    autoCapitalize='none'
                    autoCorrect='off'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Password Field */}
            <Controller
              name='password'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className='flex items-center justify-between'>
                    <FieldLabel htmlFor='password'>Password</FieldLabel>
                    <Link
                      href='/forgot-password'
                      className='text-primary hover:text-primary/80 text-sm font-medium hover:underline'
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <PasswordInput
                    {...field}
                    id='password'
                    placeholder='••••••••'
                    autoComplete='current-password'
                    required
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name='rememberMe'
              control={form.control}
              render={({ field }) => (
                <Field orientation='horizontal'>
                  <Checkbox
                    id='rememberMe'
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor='rememberMe'>Remember me</FieldLabel>
                </Field>
              )}
            />

            {/* Sign In Button */}
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full shadow-sm'
            >
              {isSubmitting ? <Spinner /> : 'Sign In'}
            </Button>
          </FieldGroup>
        </form>

        {/* Divider */}
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Login */}
        <Button
          type='button'
          variant='outline'
          onClick={signInWithGoogle}
          className='w-full'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'
            className='size-4'
            data-icon='google'
            data-prefix='fab'
            focusable='false'
            role='img'
            viewBox='0 0 488 512'
          >
            <path
              fill='currentColor'
              d='M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4'
            />
          </svg>
          Sign in with Google
        </Button>
      </div>

      {/* Footer Sign Up */}
      <p className='text-muted-foreground px-8 text-center text-sm'>
        Don&apos;t have an account?{' '}
        <Link
          href='/signup'
          className='text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline'
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
