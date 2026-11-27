'use server';

import { Resend } from 'resend';
import { z } from 'zod';
import { consumePublicSubmissionSlot } from '@/server/enquiry-rate-limit';

export type ContactFormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const contactMessageSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40),
  subject: z.enum([
    'General Enquiry',
    'Supplier Support',
    'Customer Question',
    'Billing',
    'Other'
  ]),
  message: z.string().trim().min(10).max(4000)
});

export async function submitContactMessage(
  _previousState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const honeypot = formData.get('companyWebsite');
  if (typeof honeypot === 'string' && honeypot.trim()) {
    return {
      status: 'error',
      message: 'We could not submit your message. Please try again.'
    };
  }

  const parsed = contactMessageSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    subject: formData.get('subject'),
    message: formData.get('message')
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the required fields and try again.'
    };
  }

  const isAllowed = await consumePublicSubmissionSlot(
    'contact',
    parsed.data.email.toLowerCase()
  );
  if (!isAllowed) {
    return {
      status: 'error',
      message: 'Too many messages were sent from this email. Please try again later.'
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const senderName = process.env.EMAIL_SENDER_NAME;
  const senderAddress = process.env.EMAIL_SENDER_ADDRESS;
  if (!apiKey || !senderName || !senderAddress) {
    console.error('Contact form email is not configured.');
    return {
      status: 'error',
      message:
        'The contact form is temporarily unavailable. Please email info@growmeonline.co.za.'
    };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: `${senderName} <${senderAddress}>`,
    to: process.env.CONTACT_EMAIL ?? 'info@growmeonline.co.za',
    replyTo: parsed.data.email,
    subject: `[GrowMeOnline] ${parsed.data.subject}`,
    text: [
      `Name: ${parsed.data.fullName}`,
      `Email: ${parsed.data.email}`,
      `Phone: ${parsed.data.phone || 'Not provided'}`,
      `Subject: ${parsed.data.subject}`,
      '',
      parsed.data.message
    ].join('\n')
  });

  if (error) {
    console.error('Resend rejected a contact form email', {
      name: error.name,
      statusCode: error.statusCode
    });
    return {
      status: 'error',
      message:
        'We could not send your message right now. Please try again or email info@growmeonline.co.za.'
    };
  }

  if (!data?.id) {
    console.error('Resend accepted no email ID for a contact form message.');
    return {
      status: 'error',
      message:
        'We could not confirm delivery of your message. Please email info@growmeonline.co.za.'
    };
  }

  return {
    status: 'success',
    message: 'Thanks for getting in touch. Our team will reply by email.'
  };
}
