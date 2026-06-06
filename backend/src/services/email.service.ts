import { Resend } from 'resend';
import { config } from '../config';

const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
    return { id: 'mock' };
  }

  return resend.emails.send({
    from: config.resend.fromEmail,
    to,
    subject,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string, academyName: string) {
  return sendEmail(
    email,
    `Welcome to ${academyName} on SAMS`,
    `<h1>Welcome, ${name}!</h1><p>Your account for ${academyName} has been created on SAMS.</p>`
  );
}
