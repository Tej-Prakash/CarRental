
"use client";

import Link from 'next/link';
import { CarFront, LogIn, UserPlus, HomeIcon, Shield } from 'lucide-react'; // Added Shield
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/cars', label: 'Browse Cars', icon: CarFront },
  { href: '/admin', label: 'Admin', icon: Shield }, // Added Admin link
  { href: '/login', label: 'Login', icon: LogIn, className: "ml-auto" }, // Added ml-auto to push auth links right on some screens
  { href: '/signup', label: 'Sign Up', icon: UserPlus },
];

export default function Header() {
  const pathname = usePathname();

  // Hide header on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold text-primary flex items-center">
          <CarFront className="h-7 w-7 md:h-8 md:w-8 mr-2 text-accent" />
          Wheels on Clicks
        </Link>
        <nav className="flex items-center space-x-1 md:space-x-2">
          {navItems.map((item) => (
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
          ))}
        </nav>
      </div>
    </header>
  );
}
