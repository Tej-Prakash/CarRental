
"use client";

import Link from 'next/link';
import { CarFront, LogIn, UserPlus, HomeIcon, Shield, UserCircle, LogOut, CalendarCheck2, Heart } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings, UserRole } from '@/types'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const defaultNavItems = [
  { href: '/', label: 'Home', icon: HomeIcon, authRequired: false, publicOnly: false },
  { href: '/cars', label: 'Browse Cars', icon: CarFront, authRequired: false, publicOnly: false },
];

const publicNavItems = [
  { href: '/login', label: 'Login', icon: LogIn, authRequired: false, publicOnly: true, className: "ml-auto" },
  { href: '/signup', label: 'Sign Up', icon: UserPlus, authRequired: false, publicOnly: true },
];

interface HeaderProps {
  siteTitle?: string; 
}

export default function Header({ siteTitle: initialSiteTitle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentSiteTitle, setCurrentSiteTitle] = useState(initialSiteTitle || "Travel Yatra");
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings: SiteSettings = await response.json();
          if (settings.siteTitle) {
            setCurrentSiteTitle(settings.siteTitle);
          }
        }
      } catch (error) {
        console.error("Failed to fetch site settings for header:", error);
        setCurrentSiteTitle(initialSiteTitle || "Travel Yatra");
      }
    };
    fetchSiteSettings();
  }, [initialSiteTitle]);


  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userString = localStorage.getItem('authUser');
    const authenticated = !!token;
    setIsAuthenticated(authenticated);

    if (authenticated && userString) {
      try {
        const user = JSON.parse(userString);
        setUserRole(user.role as UserRole);
        setUserName(user.name || 'User');
        setUserEmail(user.email || '');
      } catch (e) {
        console.error("Failed to parse authUser from localStorage", e);
        setUserRole(null);
        setUserName('User');
        setUserEmail('');
      }
    } else {
      setUserRole(null);
      setUserName('');
      setUserEmail('');
    }
  }, [pathname]); 

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName('');
    setUserEmail('');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/'); 
    // Force a re-render or reload if state updates aren't picked up immediately by other components
    window.location.reload(); // Simple way to ensure everything re-evaluates auth state
  };

  const currentNavItems = [
    ...defaultNavItems,
    ...(isAuthenticated ? [] : publicNavItems),
  ];


  return (
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold text-primary flex items-center">
          <CarFront className="h-7 w-7 md:h-8 md:w-8 mr-2 text-accent" />
          {currentSiteTitle}
        </Link>
        <nav className="flex items-center space-x-1 md:space-x-2">
          {currentNavItems.map((item) => {
            if (item.authRequired && !isAuthenticated) return null;
            if (item.publicOnly && isAuthenticated) return null;
            
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
                  <span className={cn("hidden sm:inline") }>{item.label}</span>
                   {(item.href.startsWith('/login') || item.href.startsWith('/signup')) && <span className="sm:hidden">{item.label}</span>}
                </Link>
              </Button>
            );
          })}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      <UserCircle className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail} ({userRole})
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/bookings" className="cursor-pointer">
                    <CalendarCheck2 className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/favorites" className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>My Favorites</span>
                  </Link>
                </DropdownMenuItem>
                {(userRole === 'Admin' || userRole === 'Manager') && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
