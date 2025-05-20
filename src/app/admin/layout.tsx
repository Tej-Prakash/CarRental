
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import type { Metadata } from 'next'; // Keep if you intend to set metadata statically, though dynamic might be better for admin
import { Button } from '@/components/ui/button';
import { PanelLeftOpen, CarFront, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';

// Static metadata might still be useful for the general section title
// export const metadata: Metadata = {
//   title: 'Admin - Travel Yatra',
//   description: 'Admin panel for Travel Yatra.',
// };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthorized'>('loading');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userString = localStorage.getItem('authUser');
    
    if (!token || !userString) {
      toast({ title: "Access Denied", description: "Please log in to access the admin panel.", variant: "destructive" });
      router.replace('/login'); // Use replace to avoid adding admin route to history
      setAuthStatus('unauthorized');
      return;
    }

    try {
      const user: User = JSON.parse(userString);
      if (user.role !== 'Admin') {
        toast({ title: "Access Denied", description: "You do not have permission to access the admin panel.", variant: "destructive" });
        router.replace('/'); // Redirect non-admins to homepage
        setAuthStatus('unauthorized');
      } else {
        setAuthStatus('authenticated');
      }
    } catch (error) {
      toast({ title: "Authentication Error", description: "Invalid user data. Please log in again.", variant: "destructive" });
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      router.replace('/login');
      setAuthStatus('unauthorized');
    }
  }, [router, toast]);

  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    // Optionally, show a brief "Redirecting..." message or just let the redirect happen.
    // The router.replace() should handle the navigation.
    return null; 
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AdminSidebar />
      <div className="flex flex-col flex-1">
         <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="md:hidden">
                <PanelLeftOpen className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="md:hidden w-72 p-0">
                <div className="p-4 border-b border-border h-16 flex items-center">
                    <Link href="/admin" className="text-xl font-bold text-primary flex items-center">
                        Admin Panel
                    </Link>
                </div>
                <nav className="flex-grow p-4 space-y-1">
                    <Button variant="ghost" className="w-full justify-start" asChild><Link href="/admin">Dashboard</Link></Button>
                    <Button variant="ghost" className="w-full justify-start" asChild><Link href="/admin/cars">Cars</Link></Button>
                    <Button variant="ghost" className="w-full justify-start" asChild><Link href="/admin/users">Users</Link></Button>
                    <Button variant="ghost" className="w-full justify-start" asChild><Link href="/admin/bookings">Bookings</Link></Button>
                    <Button variant="ghost" className="w-full justify-start" asChild><Link href="/admin/settings">Settings</Link></Button>
                </nav>
            </SheetContent>
          </Sheet>
           <Link href="/" className="flex items-center gap-2 font-semibold md:hidden">
            <CarFront className="h-6 w-6 text-accent" />
            <span className="text-lg">Travel Yatra</span>
          </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
