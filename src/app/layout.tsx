
import type {Metadata} from 'next';
import {Geist} from 'next/font/google'; // Using GeistSans as 'Geist'
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Wheels on Clicks',
  description: 'Your premier car rental service.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn(
          geistSans.variable, 
          "font-sans antialiased flex flex-col min-h-screen",
          // Apply bg-background only if not an admin page, admin layout handles its own bg
          // This is a simple way; route groups would be cleaner for distinct root layouts
          "bg-background" 
        )}
      >
        <Header />
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
