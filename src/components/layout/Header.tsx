
"use client";

import Link from 'next/link';
import { CarFront, LogIn, UserPlus, HomeIcon, Shield, UserCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const defaultNavItems = [
  { href: '/', label: 'Home', icon: HomeIcon, authRequired: false, publicOnly: false },
  { href: '/cars', label: 'Browse Cars', icon: CarFront, authRequired: false, publicOnly: false },
];

const authNavItems = [
  { href: '/profile', label: 'Profile', icon: UserCircle, authRequired: true, publicOnly: false },
  // Admin link logic: show if user is admin. This is a basic check.
  // A more robust way would involve checking role from decoded token on server or a dedicated context.
  { href: '/admin', label: 'Admin', icon: Shield, authRequired: true, publicOnly: false, adminOnly: true }, 
];

const publicNavItems = [
  { href: '/login', label: 'Login', icon: LogIn, authRequired: false, publicOnly: true, className: "ml-auto" },
  { href: '/signup', label: 'Sign Up', icon: UserPlus, authRequired: false, publicOnly: true },
];


export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userString = localStorage.getItem('authUser');
    setIsAuthenticated(!!token);
    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        setIsAdmin(user.role === 'Admin');
      } catch (e) {
        console.error("Failed to parse authUser from localStorage", e);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, [pathname]); // Re-check on route change, e.g. after login/logout

  // Hide header on admin routes if path starts with /admin (main content area)
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setIsAuthenticated(false);
    setIsAdmin(false);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/'); // Redirect to homepage
  };

  const currentNavItems = [
    ...defaultNavItems,
    ...(isAuthenticated ? authNavItems : publicNavItems),
  ];


  return (
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold text-primary flex items-center">
          <CarFront className="h-7 w-7 md:h-8 md:w-8 mr-2 text-accent" />
          Wheels on Clicks
        </Link>
        <nav className="flex items-center space-x-1 md:space-x-2">
          {currentNavItems.map((item) => {
            if (item.authRequired && !isAuthenticated) return null;
            if (item.publicOnly && isAuthenticated) return null;
            if (item.adminOnly && !isAdmin) return null; // Hide admin link if not admin

            return (
              <Button 
                key={item.href} 
                variant="ghost" 
                asChild 
                className={cn(
                  "text-sm px-2 md:px-3 py-1 md:py-2",
                  pathname === item.href ? "text-primary font-semibold bg-primary/10" : "text-foreground/70 hover:text-primary hover:bg-accent/10",
                  item.className
                )}
              >
                <Link href={item.href} className="flex items-center">
                  <item.icon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2 flex-shrink-0" />
                  <span className={cn("hidden sm:inline", {"sr-only sm:not-sr-only": item.href.startsWith('/admin') || item.href.startsWith('/login') || item.href.startsWith('/signup') } ) }>{item.label}</span>
                   {(item.href.startsWith('/login') || item.href.startsWith('/signup')) && <span className="sm:hidden">{item.label}</span>}
                </Link>
              </Button>
            );
          })}
          {isAuthenticated && (
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className={cn(
                "text-sm px-2 md:px-3 py-1 md:py-2 text-foreground/70 hover:text-primary hover:bg-accent/10",
                "ml-auto" 
              )}
            >
              <LogOut className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Logout</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
