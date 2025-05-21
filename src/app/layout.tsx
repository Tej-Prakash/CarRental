
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentSiteTitle, setCurrentSiteTitle] = useState(staticMetadata.title);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null); // null for initial loading state
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
          // Fallback if API fails
          setIsMaintenanceMode(false);
          document.title = staticMetadata.title;
        }
      } catch (error) {
        console.error("Failed to fetch site settings:", error);
        setIsMaintenanceMode(false); // Default to not in maintenance if fetch fails
        document.title = staticMetadata.title;
      }
    };

    fetchSiteSettings();
  }, [pathname]); // Re-fetch on pathname change if needed, or just once on mount
  
  useEffect(() => {
    document.title = currentSiteTitle;
  }, [currentSiteTitle]);

  const faviconLink = <link rel="icon" href="/favicon.ico" sizes="any" />;

  const isAdminRoute = pathname.startsWith('/admin');

  if (isMaintenanceMode === null) {
    // Optional: Add a global loading spinner here if settings fetch is slow
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
  
  if (isMaintenanceMode && !isAdminRoute) {
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
            !isAdminRoute && "container mx-auto px-4 py-6" // Only apply container styles to non-admin routes
        )}>
          {children}
        </main>
        {!isAdminRoute && <Footer />}
        <Toaster />
      </body>
    </html>
  );
}
