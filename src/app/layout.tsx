
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
  title: 'Travel Yatra', 
  description: 'Your premier car rental service.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentSiteTitle, setCurrentSiteTitle] = useState(staticMetadata.title);

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
        }
      } catch (error) {
        console.error("Failed to fetch site settings:", error);
        document.title = staticMetadata.title;
      }
    };

    fetchSiteSettings();
  }, []);
  
  useEffect(() => {
    document.title = currentSiteTitle;
  }, [currentSiteTitle]);

  // Static favicon link. Assumes favicon.ico is in /public
  const faviconLink = <link rel="icon" href="/favicon.ico" sizes="any" />;


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {faviconLink}
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
