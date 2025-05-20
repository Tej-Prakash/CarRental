
"use client"; // Required for useEffect

import { useEffect, useState } from 'react';
import { Geist } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import type { SiteSettings } from '@/types';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Static metadata as a fallback or for initial load
export const staticMetadata = {
  title: 'Wheels on Clicks', // Default title
  description: 'Your premier car rental service.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteTitle, setSiteTitle] = useState(staticMetadata.title);

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings: SiteSettings = await response.json();
          if (settings.siteTitle) {
            setSiteTitle(settings.siteTitle);
            document.title = settings.siteTitle;
          }
        }
      } catch (error) {
        console.error("Failed to fetch site settings:", error);
        // Fallback to static title if fetch fails
        document.title = staticMetadata.title;
      }
    };

    fetchSiteSettings();
  }, []);
  
  // Set document title initially and on siteTitle state change
  useEffect(() => {
    document.title = siteTitle;
  }, [siteTitle]);


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Metadata tags can be managed here or via Next.js metadata API */}
        {/* For simplicity, document.title is set in useEffect */}
      </head>
      <body 
        className={cn(
          geistSans.variable, 
          "font-sans antialiased flex flex-col min-h-screen",
          "bg-background" 
        )}
      >
        <Header />
        <main className="flex-grow flex flex-col container mx-auto px-4 py-6"> {/* Added container and padding for main content area */}
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
