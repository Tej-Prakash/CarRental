
"use client";

import { useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Car, GanttChartSquare, Loader2, AlertTriangle, ShoppingBag, UserPlus, CalendarClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Booking, User } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';

interface AdminStats {
  totalRevenue: number;
  totalUsers: number;
  totalCars: number;
  pendingBookingsCount: number;
  defaultCurrency: string;
  recentBookings: Booking[];
  newUsers: User[];
}

const initialStats: AdminStats = {
  totalRevenue: 0,
  totalUsers: 0,
  totalCars: 0,
  pendingBookingsCount: 0,
  defaultCurrency: 'INR',
  recentBookings: [],
  newUsers: [],
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          toast({ title: "Authentication Error", description: "No auth token found. Please log in.", variant: "destructive" });
          router.push('/login');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            router.push('/login');
          } else {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch dashboard stats' }));
            throw new Error(errorData.message);
          }
          setIsLoading(false);
          return;
        }
        const data: AdminStats = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error Fetching Stats", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currencySymbol = stats.defaultCurrency === 'INR' ? '₹' : stats.defaultCurrency === 'EUR' ? '€' : stats.defaultCurrency === 'GBP' ? '£' : '$';

  const dashboardCards = [
    { title: 'Total Revenue', value: `${currencySymbol}${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-500' },
    { title: 'Total Users', value: String(stats.totalUsers), icon: Users, color: 'text-blue-500' },
    { title: 'Cars Listed', value: String(stats.totalCars), icon: Car, color: 'text-orange-500' },
    { title: 'Pending Bookings', value: String(stats.pendingBookingsCount), icon: GanttChartSquare, color: 'text-yellow-500' },
  ];

  const getStatusVariant = (status: Booking['status']): BadgeProps["variant"] => {
    switch (status) {
      case 'Confirmed': return 'default';
      case 'Pending': return 'secondary';
      case 'Completed': return 'outline';
      case 'Cancelled': return 'destructive';
      case 'Cancellation Requested': return 'secondary';
      case 'Cancellation Rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (error && !isLoading) { // Show error only if not loading and error exists
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load dashboard data</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-primary hover:underline">
          Try reloading the page
        </button>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Overview of your car rental business." />
      {isLoading && Object.values(stats).every(val => val === initialStats[val as keyof AdminStats] || (Array.isArray(val) && val.length === 0)) ? ( // More specific loading check
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground h-5 bg-gray-200 rounded w-3/4 animate-pulse"></CardTitle>
                 <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardCards.map((stat) => (
            <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary" />Recent Bookings</CardTitle>
            <CardDescription>A quick look at the latest bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && stats.recentBookings.length === 0 ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>)}
              </div>
            ) : stats.recentBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent bookings found.</p>
            ) : (
              <ul className="space-y-3">
                {stats.recentBookings.map(booking => (
                  <li key={booking.id} className="flex items-center space-x-3 p-2 border-b last:border-b-0">
                    <Image
                        src={booking.carImageUrl || '/assets/images/default-car.png'}
                        alt={booking.carName || 'Car'}
                        width={48}
                        height={32}
                        className="rounded object-cover aspect-[3/2]"
                        data-ai-hint="car"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/default-car.png';}}
                    />
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-foreground">{booking.carName} <span className="text-xs text-muted-foreground">by {booking.userName}</span></p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(booking.startDate), "MMM dd, hh:mm a")} - {format(parseISO(booking.endDate), "hh:mm a")}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(booking.status)} className="text-xs whitespace-nowrap">{booking.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
           {stats.recentBookings.length > 0 && (
            <CardFooter className="pt-4 border-t">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/bookings">View All Bookings</Link>
              </Button>
            </CardFooter>
          )}
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center"><UserPlus className="mr-2 h-5 w-5 text-primary" />New Users</CardTitle>
             <CardDescription>Recently registered users.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading && stats.newUsers.length === 0 ? (
               <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>)}
              </div>
            ) : stats.newUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No new users found.</p>
            ) : (
              <ul className="space-y-3">
                {stats.newUsers.map(user => (
                  <li key={user.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                        <Badge variant={user.role === 'Admin' ? 'default' : (user.role === 'Manager' ? 'outline' : 'secondary')} className="text-xs">{user.role}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                            <CalendarClock className="inline h-3 w-3 mr-1" />
                            {format(parseISO(user.createdAt), "MMM dd, yyyy")}
                        </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          {stats.newUsers.length > 0 && (
            <CardFooter className="pt-4 border-t">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/users">View All Users</Link>
                </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
