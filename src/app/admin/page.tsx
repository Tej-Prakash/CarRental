
"use client";

import { useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Car, GanttChartSquare, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AdminStats {
  totalRevenue: number;
  totalUsers: number;
  totalCars: number;
  pendingBookingsCount: number;
  defaultCurrency: string;
}

const initialStats: AdminStats = {
  totalRevenue: 0,
  totalUsers: 0,
  totalCars: 0,
  pendingBookingsCount: 0,
  defaultCurrency: 'INR',
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

  if (error) {
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
      {isLoading ? (
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
                {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>A quick look at the latest bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">List of recent bookings will appear here. (Data not yet fetched by this API)</p>
            {/* Placeholder for recent bookings list */}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>New Users</CardTitle>
             <CardDescription>Recently registered users.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">List of new users will appear here. (Data not yet fetched by this API)</p>
            {/* Placeholder for new users list */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
