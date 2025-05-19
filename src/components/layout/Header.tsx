"use client";

import Link from 'next/link';
import { CarFront, LogIn, UserPlus, HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/cars', label: 'Browse Cars', icon: CarFront },
  { href: '/login', label: 'Login', icon: LogIn },
  { href: '/signup', label: 'Sign Up', icon: UserPlus },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary flex items-center">
          <CarFront className="h-8 w-8 mr-2 text-accent" />
          Wheels on Clicks
        </Link>
        <nav className="space-x-2 md:space-x-4">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" asChild className={cn(
              "text-sm md:text-base",
              pathname === item.href ? "text-primary font-semibold" : "text-foreground/80 hover:text-primary"
            )}>
              <Link href={item.href} className="flex items-center">
                <item.icon className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
