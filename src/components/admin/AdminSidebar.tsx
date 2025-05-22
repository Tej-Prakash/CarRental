
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Car, Users, GanttChartSquare, Settings, LogOut, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/types';

const allAdminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager'] },
  { href: '/admin/cars', label: 'Cars', icon: Car, roles: ['Admin', 'Manager'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['Admin', 'Manager'] },
  { href: '/admin/bookings', label: 'Bookings', icon: GanttChartSquare, roles: ['Admin', 'Manager'] },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, roles: ['Admin', 'Manager'] },
  { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['Admin'] },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem('authUser');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setCurrentUserRole(user.role as UserRole);
      } catch (e) {
        console.error("Failed to parse authUser from localStorage in AdminSidebar", e);
      }
    }
  }, []);

  const visibleNavItems = allAdminNavItems.filter(item => 
    currentUserRole && item.roles.includes(currentUserRole)
  );

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 flex-col hidden md:flex h-full">
      <div className="p-4 border-b border-border h-16 flex items-center">
        <Link href="/admin" className="text-xl font-bold text-primary flex items-center">
          Admin Panel
        </Link>
      </div>
      <nav className="flex-grow p-4 space-y-1">
        {visibleNavItems.map((item) => (
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
