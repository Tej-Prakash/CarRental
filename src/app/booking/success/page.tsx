// src/app/booking/success/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('booking_id');
  const sessionId = searchParams.get('session_id'); // Stripe checkout session ID

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null); // In a real app, define a type

  // Optional: Verify session with backend if needed, or fetch booking details
  // For this simple version, we'll assume the booking_id is sufficient indication of success path
  useEffect(() => {
    if (!bookingId) {
      setError("No booking information found. Your payment might still be processing or there was an issue.");
      setIsLoading(false);
      return;
    }
    if (!sessionId) {
        // This might indicate a direct navigation or an issue with Stripe's redirect
        console.warn("Stripe session_id missing from success URL.");
    }
    
    // Simulate fetching booking details or verifying session if needed
    // For now, just set loading to false to display success message.
    // In a real app, you might want to call your backend here to:
    // 1. Verify the Stripe session_id against the booking_id.
    // 2. Fetch confirmed booking details to display.
    // 3. Ensure the booking status is 'Confirmed' (if you had a pending state).
    setBookingDetails({ id: bookingId }); // Simplified
    setIsLoading(false);

  }, [bookingId, sessionId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Finalizing your booking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle className="text-2xl text-destructive">Booking Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link href="/cars">Browse Other Cars</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Booking Process Initiated!</CardTitle>
          <CardDescription className="text-md text-muted-foreground mt-2">
            Thank you for your booking! Your payment is being processed by Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground/90">
            Your booking ID is: <strong className="text-primary">{bookingDetails?.id.substring(0,12)}...</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            You should receive a confirmation email shortly (simulation).
            Please note that in this simplified version, the booking was marked as 'Confirmed'
            when you started the payment process. For a production system, booking confirmation
            would typically occur after Stripe confirms successful payment via a webhook.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
            <Button asChild>
              <Link href="/cars">Continue Browsing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile">View My Profile</Link> 
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
