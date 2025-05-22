
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { PanelLeftOpen, CarFront, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { User, UserRole } from '@/types';

// Define paths for Admin Sidebar for mobile view
const allAdminNavItemsForSheet = [
  { href: '/admin', label: 'Dashboard', roles: ['Admin', 'Manager'] },
  { href: '/admin/cars', label: 'Cars', roles: ['Admin', 'Manager'] },
  { href: '/admin/users', label: 'Users', roles: ['Admin', 'Manager'] },
  { href: '/admin/bookings', label: 'Bookings', roles: ['Admin', 'Manager'] },
  { href: '/admin/reports', label: 'Reports', roles: ['Admin', 'Manager'] },
  { href: '/admin/settings', label: 'Settings', roles: ['Admin'] },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthorized'>('loading');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userString = localStorage.getItem('authUser');
    
    if (!token || !userString) {
      toast({ title: "Access Denied", description: "Please log in to access the admin panel.", variant: "destructive" });
      router.replace('/login?redirect=' + pathname); 
      setAuthStatus('unauthorized');
      return;
    }

    try {
      const user: User = JSON.parse(userString);
      if (user.role !== 'Admin' && user.role !== 'Manager') {
        toast({ title: "Access Denied", description: "You do not have permission to access the admin panel.", variant: "destructive" });
        router.replace('/'); 
        setAuthStatus('unauthorized');
      } else {
        setCurrentUserRole(user.role);
        // Specific page access control
        if (pathname === '/admin/settings' && user.role !== 'Admin') {
            toast({ title: "Access Denied", description: "Only Admins can access settings.", variant: "destructive" });
            router.replace('/admin'); // Redirect managers away from settings
            setAuthStatus('unauthorized'); // Treat as unauthorized for this specific page
            return;
        }
        setAuthStatus('authenticated');
      }
    } catch (error) {
      toast({ title: "Authentication Error", description: "Invalid user data. Please log in again.", variant: "destructive" });
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      router.replace('/login');
      setAuthStatus('unauthorized');
    }
  }, [router, toast, pathname]);

  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return null; 
  }
  
  const visibleSheetNavItems = allAdminNavItemsForSheet.filter(item => 
    currentUserRole && item.roles.includes(currentUserRole)
  );

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
                    {visibleSheetNavItems.map(item => (
                       <Button key={item.href} variant="ghost" className="w-full justify-start" asChild><Link href={item.href}>{item.label}</Link></Button>
                    ))}
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
