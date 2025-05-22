
// src/lib/settingsUtils.ts
import clientPromise from '@/lib/mongodb';
import type { SiteSettings } from '@/types';
import type { ObjectId } from 'mongodb';

interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id?: ObjectId;
  settingsId?: string;
}
const SETTINGS_DOC_ID = 'main_settings';
const DEFAULT_SESSION_TIMEOUT_MINUTES = 60;

const defaultSettingsValues: Partial<SiteSettings> = {
  siteTitle: 'Travel Yatra',
  defaultCurrency: 'INR',
  maintenanceMode: false,
  sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  smtpUser: process.env.SMTP_USER || '',
  // smtpPass is intentionally NOT defaulted here from env for security if DB value is primary
  smtpSecure: process.env.SMTP_PORT === '465', // A common default logic
  emailFrom: process.env.EMAIL_FROM || '',
};


export async function getSiteSettings(): Promise<Partial<SiteSettings>> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const settingsCollection = db.collection<SiteSettingsDocument>('settings');
    let settingsFromDb = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });

    if (!settingsFromDb) {
      // If no settings in DB, return a structure based on defaults (which might include .env fallbacks)
      // smtpPass will be undefined here if not in DB, email.ts will then try .env.SMTP_PASS
      return defaultSettingsValues;
    }
    // Merge DB settings with defaults. DB settings take precedence, except for smtpPass logic.
    // For smtpPass, we'll let email.ts handle the final decision (DB or .env)
    const finalSettings: Partial<SiteSettings> = {
      ...defaultSettingsValues, // Start with defaults (which might include env vars)
      ...settingsFromDb,       // Override with DB values
      id: settingsFromDb._id?.toHexString(), // Add id if present
    };
    
    // smtpPass from DB takes precedence if present.
    // It's not included in defaultSettingsValues, so if settingsFromDb.smtpPass exists, it will be in finalSettings.
    // If settingsFromDb.smtpPass does NOT exist, finalSettings.smtpPass will be undefined.
    // The email.ts utility will then decide whether to use process.env.SMTP_PASS.

    return finalSettings;

  } catch (error) {
    console.error("Error fetching site settings in getSiteSettings:", error);
    // Return hardcoded defaults on error to prevent system failure
    // smtpPass will be undefined here.
    return {
      ...defaultSettingsValues,
      siteTitle: 'Travel Yatra', // ensure critical ones have a fallback
      defaultCurrency: 'INR',
      maintenanceMode: false,
      sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
    };
  }
}
