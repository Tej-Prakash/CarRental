
"use client"; 

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

export const staticMetadata = {
  title: 'Wheels on Clicks', 
  description: 'Your premier car rental service.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentSiteTitle, setCurrentSiteTitle] = useState(staticMetadata.title);
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string | undefined>('/favicon.ico');

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings: SiteSettings = await response.json();
          if (settings.siteTitle) {
            setCurrentSiteTitle(settings.siteTitle);
            document.title = settings.siteTitle;
          }
          if (settings.faviconUrl) {
            setCurrentFaviconUrl(settings.faviconUrl);
          } else {
             // Fallback if faviconUrl is empty or not set
            setCurrentFaviconUrl('/favicon.ico'); // Default favicon
          }
        }
      } catch (error) {
        console.error("Failed to fetch site settings:", error);
        document.title = staticMetadata.title;
        setCurrentFaviconUrl('/favicon.ico');
      }
    };

    fetchSiteSettings();
  }, []);
  
  useEffect(() => {
    document.title = currentSiteTitle;
  }, [currentSiteTitle]);

  useEffect(() => {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link') as HTMLLinkElement;
      link.type = 'image/x-icon'; // Or appropriate MIME type
      link.rel = 'shortcut icon'; // Standard rel for favicons
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    if (currentFaviconUrl) {
      link.href = currentFaviconUrl;
    } else {
      // If no faviconUrl is provided, you might want to remove the link or set a default
      // For now, we'll assume a default /favicon.ico is handled by the browser if href is not set
      // or you can ensure a default one is always in /public
       link.href = '/favicon.ico';
    }
  }, [currentFaviconUrl]);


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon link is now managed by useEffect */}
      </head>
      <body 
        className={cn(
          geistSans.variable, 
          "font-sans antialiased flex flex-col min-h-screen",
          "bg-background" 
        )}
      >
        <Header siteTitle={currentSiteTitle} />
        <main className="flex-grow flex flex-col container mx-auto px-4 py-6">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
