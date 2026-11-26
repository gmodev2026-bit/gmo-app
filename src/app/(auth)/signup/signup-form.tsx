'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { AlertTriangleIcon } from 'lucide-react';

const signUpSchema = z.object({
  name: z
    .string()
    .min(2, 'Name is required.')
    .max(50, 'Name must be at most 50 characters.'),
  lastName: z
    .string()
    .min(2, 'Last name is required.')
    .max(50, 'Last name must be at most 50 characters.'),
  email: z
    .email('Please enter a valid email address.')
    .min(5, 'Email is too short.')
    .max(50, 'Email must be at most 50 characters.'),
  password: z
    .string()
    .min(8, 'Password is too short.')
    .max(100, 'Password must be at most 100 characters.')
});

type SignupFormProps = React.ComponentProps<'div'> & {
  callbackURL?: string;
  heading?: string;
  introduction?: string;
  verificationMessage?: string;
};

export function SignupForm({
  className,
  callbackURL = '/dashboard/client',
  heading = 'Create your account',
  introduction = 'Create an account to manage your client profile and enquiries. After verifying your email, you can add your contact details.',
  verificationMessage = 'Verify your email to continue to your client profile.',
  ...props
}: SignupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  type FormValues = z.infer<typeof signUpSchema>;

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      lastName: '',
      email: '',
      password: ''
    }
  });

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);
      setError(null);
      const { error } = await authClient.signUp.email({
        name: `${values.name} ${values.lastName}`,
        email: values.email,
        password: values.password,
        callbackURL
      });

      if (error) {
        setError(error.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setRegisteredEmail(values.email);
      setResendMessage(null);
      toast.success('Account created. Check your email to verify it.');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function resendVerificationEmail() {
    if (!registeredEmail) return;

    setIsResending(true);
    setResendMessage(null);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: registeredEmail,
        callbackURL
      });

      if (error) {
        setResendMessage(
          error.message ??
            'We could not send the verification email. Please try again later.'
        );
        return;
      }

      setResendMessage(
        'If this address has an unverified account, a new verification email has been requested. Check your inbox and spam folder.'
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error
          ? error.message
          : 'We could not send the verification email. Please try again later.'
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div
      className={cn('flex w-full max-w-100 flex-col gap-6', className)}
      {...props}
    >
      {/* Header */}
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>{heading}</h1>
        <p className='text-muted-foreground text-sm'>{introduction}</p>

        {error && (
          <Alert variant='destructive' className='mt-4 w-full'>
            <AlertTriangleIcon className='mr-2 h-4 w-4' />
            {error}
          </Alert>
        )}
        {registeredEmail && (
          <Alert className='mt-4 w-full'>
            <div className='space-y-3'>
              <p>
                Account created for <strong>{registeredEmail}</strong>.{' '}
                {verificationMessage}
              </p>
              <Button
                type='button'
                variant='outline'
                disabled={isResending}
                onClick={resendVerificationEmail}
              >
                {isResending ? <Spinner /> : 'Resend verification email'}
              </Button>
              {resendMessage && (
                <p className='text-sm' role='status' aria-live='polite'>
                  {resendMessage}
                </p>
              )}
              <Button
                type='button'
                variant='ghost'
                onClick={() => router.push('/login')}
              >
                Continue to sign in
              </Button>
            </div>
          </Alert>
        )}
      </div>

      {/* Main Form Area */}
      <div className='grid gap-6'>
        {!registeredEmail && (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <FieldGroup className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <Controller
                  name='name'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type='text'
                        placeholder='Enter your first name'
                        autoComplete='given-name'
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
                  name='lastName'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type='text'
                        placeholder='Enter your last name'
                        autoComplete='family-name'
                        required
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

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
                    <FieldLabel htmlFor='password'>Password</FieldLabel>
                    <PasswordInput
                      {...field}
                      id='password'
                      placeholder='••••••••'
                      autoComplete='new-password'
                      required
                      aria-invalid={fieldState.invalid}
                      className='rounded-l-lg'
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Create Account Button */}
              <Button type='submit' disabled={isSubmitting} className='w-full'>
                {isSubmitting ? <Spinner /> : 'Create Account'}
              </Button>
            </FieldGroup>
          </form>
        )}
      </div>

      {/* Footer Sign In */}
      <p className='text-muted-foreground px-8 text-center text-sm'>
        Already have an account?{' '}
        <Link
          href='/login'
          className='text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline'
        >
          Sign in
        </Link>
      </p>

      {/* Terms */}
      <p className='text-muted-foreground px-8 text-center text-xs'>
        By clicking continue, you agree to our{' '}
        <Link
          href='#'
          className='hover:text-primary underline underline-offset-4'
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          href='#'
          className='hover:text-primary underline underline-offset-4'
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
