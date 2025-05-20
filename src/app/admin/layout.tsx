
import AdminSidebar from '@/components/admin/AdminSidebar';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { PanelLeftOpen, CarFront } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';


export const metadata: Metadata = {
  title: 'Admin - Wheels on Clicks',
  description: 'Admin panel for Wheels on Clicks.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
                {/* Re-render AdminSidebar content for mobile sheet or pass props */}
                <nav className="flex-grow p-4 space-y-1">
                    {/* Simplified nav items for mobile, or reuse AdminSidebar structure */}
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
            <span className="text-lg">Wheels on Clicks</span>
          </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
