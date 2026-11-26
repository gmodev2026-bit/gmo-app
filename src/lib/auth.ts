import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { Resend } from 'resend';
import type { ReactElement } from 'react';
import ForgotPasswordEmail from '@/components/emails/reset-password';
import VerifyEmail from '@/components/emails/verify-email';
import prisma from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTransactionalEmail({
  to,
  subject,
  react
}: {
  to: string;
  subject: string;
  react: ReactElement;
}) {
  const senderName = process.env.EMAIL_SENDER_NAME;
  const senderAddress = process.env.EMAIL_SENDER_ADDRESS;

  if (!process.env.RESEND_API_KEY || !senderName || !senderAddress) {
    throw new Error(
      'Transactional email is not configured. Set RESEND_API_KEY, EMAIL_SENDER_NAME, and EMAIL_SENDER_ADDRESS.'
    );
  }

  const { data, error } = await resend.emails.send({
    from: `${senderName} <${senderAddress}>`,
    to,
    subject,
    react
  });

  if (error) {
    console.error('Resend rejected a transactional email', {
      name: error.name,
      statusCode: error.statusCode,
      message: error.message
    });
    throw new Error(`Resend rejected the email: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error('Resend accepted no email ID for a transactional email.');
  }
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ],
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: 'Verify your email',
        react: VerifyEmail({ username: user.name, verifyUrl: url })
      });
    },
    sendOnSignUp: true
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: 'Reset your password',
        react: ForgotPasswordEmail({
          username: user.name,
          resetUrl: url,
          userEmail: user.email
        })
      });
    },
    requireEmailVerification: true
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    }
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  plugins: [admin(), nextCookies()]
});
