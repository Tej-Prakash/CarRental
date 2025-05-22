
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

export async function getSiteSettings(): Promise<Partial<SiteSettings>> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const settingsCollection = db.collection<SiteSettingsDocument>('settings');
    let settings = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });

    if (!settings) {
      return {
        siteTitle: 'Travel Yatra',
        defaultCurrency: 'INR',
        maintenanceMode: false,
        sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
      };
    }
    return {
      siteTitle: settings.siteTitle,
      defaultCurrency: settings.defaultCurrency,
      maintenanceMode: settings.maintenanceMode ?? false,
      sessionTimeoutMinutes: settings.sessionTimeoutMinutes ?? DEFAULT_SESSION_TIMEOUT_MINUTES,
    };
  } catch (error) {
    console.error("Error fetching site settings in getSiteSettings:", error);
    // Return hardcoded defaults on error to prevent system failure
    return {
      siteTitle: 'Travel Yatra',
      defaultCurrency: 'INR',
      maintenanceMode: false,
      sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
    };
  }
}
