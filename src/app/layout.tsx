
"use client"; 

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Geist } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MaintenancePage from '@/components/MaintenancePage';
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

// Define paths that should always be accessible, even in maintenance mode
const ALWAYS_ACCESSIBLE_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  // Add /reset-password/[token] pattern check below
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentSiteTitle, setCurrentSiteTitle] = useState(staticMetadata.title);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
  const pathname = usePathname();

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
          setIsMaintenanceMode(settings.maintenanceMode ?? false);
        } else {
          setIsMaintenanceMode(false);
          document.title = staticMetadata.title;
        }
      } catch (error) {
        console.error("Failed to fetch site settings:", error);
        setIsMaintenanceMode(false); 
        document.title = staticMetadata.title;
      }
    };

    fetchSiteSettings();
  }, [pathname]); 
  
  useEffect(() => {
    document.title = currentSiteTitle;
  }, [currentSiteTitle]);

  const faviconLink = <link rel="icon" href="/favicon.ico" sizes="any" />;

  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = ALWAYS_ACCESSIBLE_PATHS.includes(pathname) || pathname.startsWith('/reset-password/');

  if (isMaintenanceMode === null) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>{faviconLink}</head>
        <body className={cn(geistSans.variable, "font-sans antialiased flex flex-col min-h-screen bg-background")}>
          <div className="flex flex-grow items-center justify-center">
            {/* You could put a Loader2 component here */}
          </div>
        </body>
      </html>
    );
  }
  
  if (isMaintenanceMode && !isAdminRoute && !isAuthRoute) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          {faviconLink}
          <title>{currentSiteTitle} - Under Maintenance</title>
        </head>
        <body 
          className={cn(
            geistSans.variable, 
            "font-sans antialiased flex flex-col min-h-screen",
            "bg-background" 
          )}
        >
          <MaintenancePage />
          <Toaster />
        </body>
      </html>
    );
  }


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
        {!isAdminRoute && <Header siteTitle={currentSiteTitle} />}
        <main className={cn(
            "flex-grow flex flex-col",
            !isAdminRoute && "container mx-auto px-4 py-6" 
        )}>
          {children}
        </main>
        {!isAdminRoute && <Footer />}
        <Toaster />
      </body>
    </html>
  );
}
