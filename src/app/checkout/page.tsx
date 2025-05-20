
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CreditCard, CalendarDays, Tag, CarIcon, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { format, parseISO } from 'date-fns';

interface CheckoutBookingDetails {
  carId: string;
  carName: string;
  carImageUrl?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  rentalDays: number;
  pricePerDay: number;
  totalPrice: number;
  currency: string;
  currencySymbol: string;
}

declare global {
  interface Window {
    Razorpay: any; 
  }
}

export default function CheckoutPage() {
  const [bookingDetails, setBookingDetails] = useState<CheckoutBookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isRazorpayScriptLoaded, setIsRazorpayScriptLoaded] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const storedDetails = localStorage.getItem('checkoutBookingDetails');
    if (storedDetails) {
      try {
        setBookingDetails(JSON.parse(storedDetails));
      } catch (e) {
        toast({ title: "Error", description: "Invalid checkout data. Please try again.", variant: "destructive" });
        router.replace('/cars');
      }
    } else {
      toast({ title: "No Booking Selected", description: "Please select a car and dates first.", variant: "destructive" });
      router.replace('/cars');
    }
    setIsLoading(false);

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      console.error("Razorpay Key ID is not set. Payment functionality will be disabled.");
      toast({
        title: "Payment Configuration Error",
        description: "Razorpay is not configured. Please contact support.",
        variant: "destructive",
        duration: Infinity,
      });
    }

    // Cleanup localStorage if user navigates away using browser back/forward or closes tab
    const handleBeforeUnload = () => {
      localStorage.removeItem('checkoutBookingDetails');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also clear if component unmounts for other reasons (e.g. successful navigation)
      // but specifically not if payment is processing.
      // This is tricky, main cleanup should happen after payment attempt.
    };

  }, [router, toast]);

  const handleConfirmAndPay = async () => {
    if (!bookingDetails) {
      toast({ title: "Error", description: "Booking details missing.", variant: "destructive" });
      return;
    }
    
    setIsPaymentProcessing(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Error", description: "Please log in to make a booking.", variant: "destructive" });
      localStorage.removeItem('checkoutBookingDetails'); // Clear stale data
      router.push('/login?redirect=/checkout');
      setIsPaymentProcessing(false);
      return;
    }

    if (!isRazorpayScriptLoaded || typeof window.Razorpay === 'undefined') {
      toast({ title: "Payment Gateway Error", description: "Razorpay script not loaded. Please try again shortly.", variant: "destructive" });
      setIsPaymentProcessing(false);
      return;
    }

    try {
      const orderResponse = await fetch('/api/checkout/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          carId: bookingDetails.carId,
          startDate: bookingDetails.startDate,
          endDate: bookingDetails.endDate,
        }),
      });

      if (!orderResponse.ok) {
        if (orderResponse.status === 401) {
            toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
            localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); localStorage.removeItem('checkoutBookingDetails'); router.push('/login');
        } else {
            const errorData = await orderResponse.json().catch(() => ({ message: 'Failed to create Razorpay order.' }));
            throw new Error(errorData.message || 'Failed to create Razorpay order.');
        }
        setIsPaymentProcessing(false);
        return;
      }
      const orderData = await orderResponse.json();
      const authUserString = localStorage.getItem('authUser');
      const authUser = authUserString ? JSON.parse(authUserString) : { name: 'Guest', email: '' };


      const options = {
        key: orderData.keyId, 
        amount: orderData.amount.toString(), 
        currency: orderData.currency,
        name: "Travel Yatra", // Use your actual site name, can be fetched from settings too
        description: `Booking for ${bookingDetails.carName}`,
        image: bookingDetails.carImageUrl || `${process.env.NEXT_PUBLIC_APP_URL}/icon.svg`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          const verifyResponse = await fetch('/api/checkout/razorpay-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: orderData.bookingId,
            }),
          });

          localStorage.removeItem('checkoutBookingDetails'); // Clean up after payment attempt
          const verifyResult = await verifyResponse.json();
          if (verifyResponse.ok) {
            toast({ title: "Booking Confirmed!", description: `Your booking for ${bookingDetails.carName} is confirmed. Booking ID: ${orderData.bookingId.substring(0,8)}...` });
            router.push(`/profile/bookings`); 
          } else {
            throw new Error(verifyResult.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: authUser.name,
          email: authUser.email,
        },
        notes: {
          booking_id: orderData.bookingId,
          car_id: bookingDetails.carId,
        },
        theme: { color: "#3F51B5" },
        modal: {
            ondismiss: function(){
                toast({ title: "Payment Cancelled", description: "Your payment was not completed.", variant: "default" });
                localStorage.removeItem('checkoutBookingDetails');
                setIsPaymentProcessing(false);
                // Optionally redirect or offer to try again
                router.push(`/cars/${bookingDetails.carId}`);
            }
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any){
            toast({
                title: "Payment Failed",
                description: `Error: ${response.error.code} - ${response.error.description}. Reason: ${response.error.reason}. Please try again or contact support.`,
                variant: "destructive",
                duration: 7000,
            });
            localStorage.removeItem('checkoutBookingDetails');
            setIsPaymentProcessing(false);
      });
      rzp.open();
      // setIsPaymentProcessing is set to false by ondismiss or if handler fails before this.

    } catch (bookingError: any) {
      toast({ title: "Booking Error", description: bookingError.message || "Could not process your booking.", variant: "destructive" });
      localStorage.removeItem('checkoutBookingDetails');
      setIsPaymentProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground">Could not load booking details. Please try selecting your car again.</p>
        <Button asChild className="mt-6">
          <Link href="/cars">Back to Cars</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setIsRazorpayScriptLoaded(true)}
        onError={(e) => {
          console.error("Failed to load Razorpay SDK", e);
          toast({ title: "Payment Gateway Error", description: "Could not load Razorpay SDK. Please refresh.", variant: "destructive" });
        }}
      />
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Review Your Booking</CardTitle>
          <CardDescription>Please confirm the details below before proceeding to payment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-1/3 aspect-video rounded-md overflow-hidden">
              <Image
                src={bookingDetails.carImageUrl || 'https://placehold.co/300x200.png?text=No+Image'}
                alt={bookingDetails.carName}
                fill
                className="object-cover"
                data-ai-hint="car rental"
              />
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-semibold text-primary">{bookingDetails.carName}</h2>
              <p className="text-muted-foreground">Car ID: {bookingDetails.carId.substring(0, 8)}...</p>
            </div>
          </div>

          <div className="border-t border-b py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-accent" />Rental Period:</span>
              <span className="font-semibold text-right">
                {format(parseISO(bookingDetails.startDate), 'MMM dd, yyyy')} to {format(parseISO(bookingDetails.endDate), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground flex items-center"><Info className="mr-2 h-5 w-5 text-accent" />Duration:</span>
              <span className="font-semibold">{bookingDetails.rentalDays} day{bookingDetails.rentalDays !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-5 w-5 text-accent" />Price per Day:</span>
              <span className="font-semibold">{bookingDetails.currencySymbol}{bookingDetails.pricePerDay.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-3xl font-bold text-primary">
              {bookingDetails.currencySymbol}{bookingDetails.totalPrice.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground"> ({bookingDetails.currency})</span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            size="lg" 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleConfirmAndPay}
            disabled={isPaymentProcessing || !isRazorpayScriptLoaded || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
          >
            {isPaymentProcessing ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2 h-5 w-5" />}
            {isPaymentProcessing ? 'Processing Payment...' : 'Confirm & Pay'}
          </Button>
          {!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && <p className="text-xs text-destructive text-center">Razorpay payments are currently disabled due to missing configuration.</p>}
          <Button variant="outline" className="w-full" onClick={() => { localStorage.removeItem('checkoutBookingDetails'); router.back();}} disabled={isPaymentProcessing}>
            Back to Car Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
