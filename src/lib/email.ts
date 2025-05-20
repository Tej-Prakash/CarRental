// src/lib/email.ts
import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort ? parseInt(smtpPort, 10) : 587, // Default to 587 if not specified
  secure: smtpPort === '465', // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendEmail({ to, subject, text, html }: MailOptions): Promise<void> {
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !emailFrom) {
    console.warn(
      'SMTP environment variables not fully configured. Email sending is disabled. Logging email content instead.'
    );
    console.log('--- SIMULATED EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`From: ${emailFrom}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text Body (if any): ${text}`);
    console.log('HTML Body:');
    console.log(html);
    console.log('--- END SIMULATED EMAIL ---');
    // In a real scenario where config is partial, you might throw an error or have specific handling
    // For now, we'll just log and pretend it sent for development flow.
    // throw new Error("SMTP configuration is incomplete. Cannot send email.");
    return; // Simulate success for dev flow
  }

  const mailOptions = {
    from: emailFrom,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email.');
  }
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${process.env.PASSWORD_RESET_URL_BASE || 'http://localhost:9002/reset-password'}/${token}`;
  const subject = 'Reset your Travel Yatra password';
  const text = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;
  const html = `<p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
               <p>Please click on the following link, or paste this into your browser to complete the process:</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`;

  await sendEmail({ to, subject, text, html });
}
