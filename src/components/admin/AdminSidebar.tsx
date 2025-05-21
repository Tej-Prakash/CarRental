"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Car, Users, GanttChartSquare, Settings, LogOut, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/cars', label: 'Cars', icon: Car },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/bookings', label: 'Bookings', icon: GanttChartSquare },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 flex-col hidden md:flex h-full">
      <div className="p-4 border-b border-border h-16 flex items-center">
        <Link href="/admin" className="text-xl font-bold text-primary flex items-center">
          Admin Panel
        </Link>
      </div>
      <nav className="flex-grow p-4 space-y-1">
        {adminNavItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)) ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start",
               (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))) ? "font-semibold text-primary bg-primary/10" : "text-foreground/80 hover:text-primary hover:bg-accent/10"
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t border-border mt-auto">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/">
            <LogOut className="h-5 w-5 mr-3" />
            Back to Site
          </Link>
        </Button>
      </div>
    </aside>
  );
}
