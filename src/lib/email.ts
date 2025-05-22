
// src/lib/email.ts
import nodemailer from 'nodemailer';
import { getSiteSettings } from '@/lib/settingsUtils'; // Import the new utility

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: MailOptions): Promise<void> {
  const siteSettings = await getSiteSettings();

  const effectiveSmtpHost = siteSettings.smtpHost || process.env.SMTP_HOST;
  const effectiveSmtpPort = siteSettings.smtpPort || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined);
  const effectiveSmtpUser = siteSettings.smtpUser || process.env.SMTP_USER;
  // Prioritize DB password if set, otherwise fallback to .env.
  // getSiteSettings() will return smtpPass from DB if it exists.
  const effectiveSmtpPass = siteSettings.smtpPass || process.env.SMTP_PASS; 
  const effectiveEmailFrom = siteSettings.emailFrom || process.env.EMAIL_FROM;
  // smtpSecure from DB takes precedence if defined, otherwise infer from port or .env if possible.
  const effectiveSmtpSecure = typeof siteSettings.smtpSecure === 'boolean' 
    ? siteSettings.smtpSecure 
    : (effectiveSmtpPort === 465);


  if (!effectiveSmtpHost || !effectiveSmtpPort || !effectiveSmtpUser || !effectiveSmtpPass || !effectiveEmailFrom) {
    console.warn(
      'SMTP settings (from DB or .env) are not fully configured. Email sending is disabled. Logging email content instead.'
    );
    console.log('--- SIMULATED EMAIL (Config Incomplete) ---');
    console.log(`To: ${to}`);
    console.log(`From: ${effectiveEmailFrom || 'fallback-from@example.com'}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text Body (if any): ${text || 'N/A'}`);
    console.log('HTML Body (first 200 chars):');
    console.log(html.substring(0,200) + (html.length > 200 ? '...' : ''));
    console.log('--- END SIMULATED EMAIL ---');
    return; 
  }

  const transporter = nodemailer.createTransport({
    host: effectiveSmtpHost,
    port: effectiveSmtpPort,
    secure: effectiveSmtpSecure,
    auth: {
      user: effectiveSmtpUser,
      pass: effectiveSmtpPass,
    },
    // Consider adding timeout options for production
    // connectionTimeout: 5000, // 5 seconds
    // greetingTimeout: 5000, // 5 seconds
    // socketTimeout: 10000, // 10 seconds
  });

  const mailOptions = {
    from: effectiveEmailFrom,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to, 'using host:', effectiveSmtpHost);
  } catch (error) {
    console.error('Error sending email:', error);
    // Log which config was used for easier debugging
    console.error('Attempted to use SMTP config:', {
        host: effectiveSmtpHost,
        port: effectiveSmtpPort,
        user: effectiveSmtpUser,
        from: effectiveEmailFrom,
        secure: effectiveSmtpSecure,
        passUsed: effectiveSmtpPass ? 'Yes (either DB or ENV)' : 'No',
    });
    throw new Error('Failed to send email. Check server logs for SMTP configuration details and errors.');
  }
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const siteSettings = await getSiteSettings();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  // Use PASSWORD_RESET_URL_BASE from .env if set, otherwise default structure.
  const resetUrlBase = process.env.PASSWORD_RESET_URL_BASE || `${appUrl}/reset-password`;
  const resetUrl = `${resetUrlBase}/${token}`;
  
  const subject = `Reset your ${siteSettings.siteTitle || 'Travel Yatra'} password`;
  const text = `You are receiving this email because you (or someone else) have requested the reset of the password for your account on ${siteSettings.siteTitle || 'Travel Yatra'}.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;
  const html = `<p>You are receiving this email because you (or someone else) have requested the reset of the password for your account on <strong>${siteSettings.siteTitle || 'Travel Yatra'}</strong>.</p>
               <p>Please click on the following link, or paste this into your browser to complete the process:</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`;

  await sendEmail({ to, subject, text, html });
}
