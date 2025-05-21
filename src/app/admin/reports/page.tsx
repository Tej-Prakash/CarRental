"use client";

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, DollarSign, GanttChartSquare, Filter, CalendarIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { Badge, BadgeProps } from '@/components/ui/badge';
import Image from 'next/image';

interface ReportData {
  totalBookings: number;
  totalRevenue: number;
  bookings: Booking[];
  currencySymbol: string;
  currency: string;
}

const initialReportData: ReportData = {
  totalBookings: 0,
  totalRevenue: 0,
  bookings: [],
  currencySymbol: '₹',
  currency: 'INR',
};

const bookingStatusOptions: (Booking['status'] | 'All')[] = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'Cancellation Requested', 'Cancellation Rejected'];

export default function AdminReportsPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<Booking['status'] | 'All'>('All');
  
  const [reportData, setReportData] = useState<ReportData>(initialReportData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Error", description: "No auth token found. Please log in.", variant: "destructive" });
      router.push('/login');
      setIsLoading(false);
      return;
    }

    const queryParams = new URLSearchParams();
    if (startDate && isValid(parseISO(startDate))) queryParams.append('startDate', startDate);
    if (endDate && isValid(parseISO(endDate))) queryParams.append('endDate', endDate);
    if (statusFilter !== 'All') queryParams.append('status', statusFilter);

    try {
      const response = await fetch(`/api/admin/reports?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          router.push('/login');
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch report data' }));
          throw new Error(errorData.message);
        }
        setIsLoading(false);
        return;
      }
      const data: ReportData = await response.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
      setReportData(initialReportData); // Reset data on error
      toast({ title: "Error Fetching Report", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch report data when filter criteria change (or on initial load with default filters if desired)
  // For now, it will be triggered by the "Generate Report" button
  // useEffect(() => {
  //   fetchReportData();
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [startDate, endDate, statusFilter]); // Auto-fetch on filter change, or use a button

  const handleGenerateReport = () => {
    if (startDate && endDate && parseISO(startDate) > parseISO(endDate)) {
        toast({ title: "Invalid Date Range", description: "Start date cannot be after end date.", variant: "destructive" });
        return;
    }
    fetchReportData();
  };

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

  return (
    <div>
      <AdminPageHeader title="Reports &amp; Analytics" description="Filter and view booking reports." />

      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" /> Filter Options</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="startDate" className="flex items-center text-sm font-medium text-muted-foreground mb-1">
              <CalendarIcon className="mr-1 h-4 w-4" /> Start Date (Booking Created)
            </Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="endDate" className="flex items-center text-sm font-medium text-muted-foreground mb-1">
              <CalendarIcon className="mr-1 h-4 w-4" /> End Date (Booking Created)
            </Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="statusFilter" className="text-sm font-medium text-muted-foreground mb-1">Booking Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Booking['status'] | 'All')}>
              <SelectTrigger id="statusFilter">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {bookingStatusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 lg:col-span-1 lg:mt-6">
            <Button onClick={handleGenerateReport} className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading report data...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="shadow-md bg-destructive/10 border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                    <AlertTriangle className="mr-2 h-5 w-5" /> Error Loading Report
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error}</p>
                <Button variant="outline" onClick={handleGenerateReport} className="mt-4">Try Again</Button>
            </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
                <GanttChartSquare className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalBookings}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue (Completed)</CardTitle>
                <DollarSign className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.currencySymbol}{reportData.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">({reportData.currency})</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Filtered Bookings ({reportData.bookings.length})</CardTitle>
              <CardDescription>Detailed list of bookings matching the applied filters.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {reportData.bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No bookings match the current filter criteria.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] hidden sm:table-cell">Car Image</TableHead>
                      <TableHead>Booking ID</TableHead>
                      <TableHead className="hidden md:table-cell">Car</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Dates &amp; Times</TableHead>
                      <TableHead className="hidden lg:table-cell">Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Booked On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.bookings.map((booking) => (
                      <TableRow key={booking.id}>
                         <TableCell className="hidden sm:table-cell">
                          <Image 
                            src={booking.carImageUrl || '/assets/images/default-car.png'} 
                            alt={booking.carName || 'Car image'}
                            width={60} 
                            height={40} 
                            className="rounded object-cover aspect-[3/2]"
                            data-ai-hint="car"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/default-car.png';}}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{booking.id.substring(0,8)}...</TableCell>
                        <TableCell className="hidden md:table-cell">{booking.carName}</TableCell>
                        <TableCell>{booking.userName}</TableCell>
                        <TableCell className="text-xs">
                          {format(parseISO(booking.startDate), "MMM dd, yy, hh:mm a")} - <br/>{format(parseISO(booking.endDate), "MMM dd, yy, hh:mm a")}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{reportData.currencySymbol}{booking.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                        </TableCell>
                         <TableCell className="hidden xl:table-cell text-xs">
                          {booking.createdAt ? format(parseISO(booking.createdAt), "MMM dd, yy, hh:mm a") : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
