
// src/app/booking/success/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  // const sessionId = searchParams.get('session_id'); // Was used for Stripe

  useEffect(() => {
    // Clear any checkout related localStorage items if needed
    localStorage.removeItem('checkoutBookingDetails');
  }, []);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] py-12 px-4">
      <Card className="w-full max-w-lg shadow-xl text-center">
        <CardHeader>
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary">Booking Process Initiated!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your booking request has been successfully processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookingId ? (
            <p>
              Your Booking ID is: <span className="font-semibold text-accent">{bookingId.substring(0,8)}...</span>
            </p>
          ) : (
            <p>Your booking is being confirmed.</p>
          )}
          <p className="text-sm">
            You will typically be redirected to your bookings page after payment confirmation.
            If you used Razorpay, the payment was handled in a modal, and you should have been redirected to your profile bookings.
          </p>
          <p className="text-xs text-muted-foreground">
            This page serves as a general success indicator.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-2 pt-6">
          <Button asChild>
            <Link href="/profile/bookings">View My Bookings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/cars">Browse More Cars</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
