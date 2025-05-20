
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from '@/types';
import { Loader2, Car, CalendarDays, AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react';
import Image from 'next/image';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { isFuture, parseISO, format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MyBookingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchMyBookings = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Unauthorized", description: "Please log in to view your bookings.", variant: "destructive" });
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/profile/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch your bookings." }));
        throw new Error(errorData.message);
      }
      const data: Booking[] = await response.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error Fetching Bookings", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, toast]);

  const handleRequestCancellation = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`/api/bookings/${bookingToCancel.id}/request-cancellation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to request cancellation');
      
      toast({ title: "Cancellation Requested", description: result.message });
      fetchMyBookings(); // Re-fetch to update status
    } catch (error: any) {
      toast({ title: "Cancellation Request Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
      setBookingToCancel(null);
    }
  };

  const confirmRequestCancellation = (booking: Booking) => {
    setBookingToCancel(booking);
    setShowCancelDialog(true);
  };

  const getStatusVariant = (status: Booking['status']): BadgeProps["variant"] => {
    switch (status) {
      case 'Confirmed': return 'default';
      case 'Pending': return 'secondary';
      case 'Completed': return 'outline';
      case 'Cancelled': return 'destructive';
      case 'Cancellation Requested': return 'secondary'; // Similar to pending, needs attention
      case 'Cancellation Rejected': return 'destructive'; // Or a different color if needed
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchMyBookings} className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <CalendarDays className="h-8 w-8 mr-3 text-accent" /> My Bookings
          </CardTitle>
          <CardDescription>View your past, current, and upcoming car rentals.</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-10">
              <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">You have no bookings yet.</p>
              <Button asChild className="mt-4">
                <a href="/cars">Browse Cars</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className="shadow-md overflow-hidden">
                  <div className="grid md:grid-cols-12 gap-0">
                    <div className="md:col-span-3 relative aspect-video md:aspect-auto min-h-[150px] md:min-h-full">
                       <Image 
                        src={booking.carImageUrl || 'https://placehold.co/300x200.png'} 
                        alt={booking.carName || 'Car image'}
                        fill
                        className="object-cover"
                        data-ai-hint="car rental"
                      />
                    </div>
                    <div className="md:col-span-9 p-4 flex flex-col">
                      <CardHeader className="p-0 mb-3">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl font-semibold text-primary">{booking.carName}</CardTitle>
                            <Badge variant={getStatusVariant(booking.status)} className="text-xs whitespace-nowrap">
                                {booking.status}
                            </Badge>
                        </div>
                        <CardDescription className="text-sm text-muted-foreground">
                          Booking ID: {booking.id.substring(0,8)}...
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0 flex-grow space-y-2 text-sm">
                        <p><strong>Dates:</strong> {format(parseISO(booking.startDate), "MMM dd, yyyy")} - {format(parseISO(booking.endDate), "MMM dd, yyyy")}</p>
                        <p><strong>Total Price:</strong> ${booking.totalPrice.toFixed(2)}</p>
                        {booking.createdAt && <p className="text-xs text-muted-foreground">Booked on: {format(parseISO(booking.createdAt), "MMM dd, yyyy, HH:mm")}</p>}
                      </CardContent>
                      <CardFooter className="p-0 mt-4 pt-4 border-t md:self-end">
                        {booking.status === 'Confirmed' && isFuture(parseISO(booking.startDate)) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => confirmRequestCancellation(booking)}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Request Cancellation
                          </Button>
                        )}
                        {(booking.status === 'Cancellation Requested') && (
                            <p className="text-sm text-accent flex items-center"><Info className="h-4 w-4 mr-1"/>Cancellation pending admin approval.</p>
                        )}
                         {(booking.status === 'Cancelled' || booking.status === 'Cancellation Rejected') && (
                            <p className="text-sm text-destructive flex items-center"><Info className="h-4 w-4 mr-1"/>{booking.status}</p>
                        )}
                         {(booking.status === 'Completed') && (
                            <p className="text-sm text-green-600 flex items-center"><CheckCircle className="h-4 w-4 mr-1"/>Booking Completed</p>
                        )}
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Cancellation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to request cancellation for the booking of "{bookingToCancel?.carName}" 
              from {bookingToCancel ? format(parseISO(bookingToCancel.startDate), "MMM dd, yyyy") : ''}
              to {bookingToCancel ? format(parseISO(bookingToCancel.endDate), "MMM dd, yyyy") : ''}?
              This request will be sent to an admin for approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setShowCancelDialog(false); setBookingToCancel(null);}} disabled={isCancelling}>
              Back
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestCancellation} disabled={isCancelling} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, Request Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
