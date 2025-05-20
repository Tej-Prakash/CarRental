
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Car, SiteSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, DollarSign, Fuel, Gauge, GitCommitVertical, MapPin, MessageCircle, Users, Loader2, AlertTriangle, Star, CalendarDays, Info, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ChatbotDialog from '@/components/ChatbotDialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInCalendarDays, isBefore, startOfToday } from "date-fns";
import { cn } from '@/lib/utils';
import type { DateRange } from "react-day-picker";
import { useRouter } from 'next/navigation';
import Script from 'next/script';


interface CarDetailsPageProps {
  params: { id: string };
}

declare global {
  interface Window {
    Razorpay: any; 
  }
}

export default function CarDetailsPage({ params }: CarDetailsPageProps) {
  const [car, setCar] = useState<Car | null>(null);
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings>>({ defaultCurrency: 'INR' }); // Default to INR for Razorpay
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isRazorpayScriptLoaded, setIsRazorpayScriptLoaded] = useState(false);

  const today = startOfToday();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined, 
    to: undefined,  
  });

  useEffect(() => {
    const fetchCarDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/cars/${params.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Car not found or server error (${response.status})` }));
          throw new Error(errorData.message);
        }
        const data: Car = await response.json();
        setCar(data);
      } catch (err: any) {
        setError(err.message);
        setCar(null);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settingsData: SiteSettings = await response.json();
          setSiteSettings(settingsData);
        }
      } catch (settingsError) {
        console.warn("Could not fetch site settings for currency display, defaulting to INR.", settingsError);
         setSiteSettings({ defaultCurrency: 'INR' });
      }
    };

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      console.error("Razorpay Key ID is not set. Payment functionality will be disabled.");
      toast({
        title: "Payment Configuration Error",
        description: "Razorpay is not configured. Please contact support.",
        variant: "destructive",
        duration: Infinity,
      });
    }

    if (params.id) {
      fetchCarDetails();
      fetchSiteSettings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]); 


  const handleBookWithRazorpay = async () => {
    if (!car || !dateRange?.from || !dateRange?.to) {
      toast({ title: "Missing Information", description: "Please select a car and a valid date range.", variant: "destructive" });
      return;
    }
    if (isBefore(dateRange.from, today) || (dateRange.to && isBefore(dateRange.to, dateRange.from))) {
      toast({ title: "Invalid Dates", description: "Please select valid future dates.", variant: "destructive" });
      return;
    }
    
    setIsBookingLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Error", description: "Please log in to make a booking.", variant: "destructive" });
      router.push('/login');
      setIsBookingLoading(false);
      return;
    }

    if (!isRazorpayScriptLoaded || typeof window.Razorpay === 'undefined') {
      toast({ title: "Payment Gateway Error", description: "Razorpay script not loaded. Please try again shortly.", variant: "destructive" });
      setIsBookingLoading(false);
      return;
    }

    try {
      // 1. Create Razorpay Order via backend
      const orderResponse = await fetch('/api/checkout/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          carId: car.id,
          startDate: format(dateRange.from, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          endDate: format(dateRange.to, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        }),
      });

      if (!orderResponse.ok) {
        if (orderResponse.status === 401) {
            toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
            localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); router.push('/login');
        } else {
            const errorData = await orderResponse.json().catch(() => ({ message: 'Failed to create Razorpay order.' }));
            throw new Error(errorData.message || 'Failed to create Razorpay order.');
        }
        setIsBookingLoading(false);
        return;
      }
      const orderData = await orderResponse.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.keyId, 
        amount: orderData.amount.toString(), 
        currency: orderData.currency,
        name: siteSettings.siteTitle || "Wheels on Clicks",
        description: `Booking for ${car.name}`,
        image: car.imageUrls[0] || `${process.env.NEXT_PUBLIC_APP_URL}/icon.svg`, // Replace with your logo URL
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          // 3. Verify Payment on backend
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

          const verifyResult = await verifyResponse.json();
          if (verifyResponse.ok) {
            toast({ title: "Booking Confirmed!", description: `Your booking for ${car.name} is confirmed. Booking ID: ${orderData.bookingId.substring(0,8)}...` });
            // Optionally redirect to a success page or profile/bookings
            router.push(`/profile/bookings`); 
          } else {
            throw new Error(verifyResult.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: orderData.userName,
          email: orderData.userEmail,
          // contact: "USER_PHONE_NUMBER" // If available
        },
        notes: {
          booking_id: orderData.bookingId,
          car_id: car.id,
        },
        theme: {
          color: "#3F51B5" // Your primary color
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
      });
      rzp.open();

    } catch (bookingError: any) {
      toast({ title: "Booking Error", description: bookingError.message || "Could not process your booking.", variant: "destructive" });
    } finally {
      setIsBookingLoading(false);
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
        <h1 className="text-2xl font-semibold text-destructive">Error Loading Car</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild className="mt-6">
          <Link href="/cars">Back to Cars</Link>
        </Button>
      </div>
    );
  }
  
  if (!car) {
    return ( 
      <div className="text-center py-20">
        <h1 className="text-2xl font-semibold">Car not found</h1>
        <p className="text-muted-foreground">The car you are looking for does not exist or has been removed.</p>
        <Button asChild className="mt-4">
          <Link href="/cars">Back to Cars</Link>
        </Button>
      </div>
    );
  }
  
  const rentalDays = dateRange?.from && dateRange?.to ? differenceInCalendarDays(dateRange.to, dateRange.from) : 0;
  const totalPrice = rentalDays > 0 ? rentalDays * car.pricePerDay : 0;
  
  // Use currency from siteSettings, default to INR if not available
  const displayCurrency = siteSettings.defaultCurrency || 'INR';
  const currencySymbol = displayCurrency === 'INR' ? '₹' : displayCurrency === 'EUR' ? '€' : displayCurrency === 'GBP' ? '£' : '$';
  const primaryImageUrl = car.imageUrls && car.imageUrls.length > 0 ? car.imageUrls[0] : '/assets/images/default-car.png';


  return (
    <div className="space-y-8 container mx-auto py-8 px-4">
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
          setIsRazorpayScriptLoaded(true);
          console.log("Razorpay SDK loaded.");
        }}
        onError={(e) => {
          console.error("Failed to load Razorpay SDK", e);
          toast({ title: "Payment Gateway Error", description: "Could not load Razorpay SDK. Please refresh.", variant: "destructive" });
        }}
      />
      <Card className="overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-video md:aspect-auto min-h-[300px] md:min-h-[400px]">
            <Image 
              src={primaryImageUrl} 
              alt={car.name} 
              fill 
              className="object-cover"
              data-ai-hint={car.aiHint || 'car'}
              priority
              onError={(e) => { (e.target as HTMLImageElement).src = `/assets/images/default-car.png`; (e.target as HTMLImageElement).alt = "Image error, fallback shown"; }}

            />
          </div>
          <div className="p-6 md:p-8 flex flex-col">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{car.name}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">{car.type}</CardDescription>
              {car.description && (
                <p className="text-sm text-foreground/70 mt-1">{car.description}</p>
              )}
            </CardHeader>
            
            <CardContent className="p-0 flex-grow space-y-4">
              <p className="text-foreground/90 text-base">{car.longDescription}</p>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <InfoItem icon={<Users className="h-5 w-5 text-accent" />} label={`${car.seats} Seats`} />
                <InfoItem icon={<Gauge className="h-5 w-5 text-accent" />} label={car.engine} />
                <InfoItem icon={<GitCommitVertical className="h-5 w-5 text-accent" />} label={car.transmission} />
                <InfoItem icon={<Fuel className="h-5 w-5 text-accent" />} label={car.fuelType} />
                <InfoItem icon={<MapPin className="h-5 w-5 text-accent" />} label={`Location: ${car.location}`} />
                <InfoItem icon={<Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />} label={`${car.rating.toFixed(1)} (${car.reviews} reviews)`} />
              </div>

              <div>
                <h3 className="font-semibold text-md mb-2 text-primary">Key Features:</h3>
                <div className="flex flex-wrap gap-2">
                  {car.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs">{feature}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-0 mt-6 pt-6 border-t flex flex-col items-center gap-4">
              <div className="w-full">
                <h3 className="font-semibold text-md mb-2 text-primary">Select Rental Dates:</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      disabled={{ before: today }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="text-center sm:text-left w-full mt-2">
                <p className="text-3xl font-bold text-primary">{currencySymbol}{car.pricePerDay.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">per day ({displayCurrency})</span></p>
                {rentalDays > 0 && (
                   <p className="text-xl font-semibold text-primary mt-1">Total: {currencySymbol}{totalPrice.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">for {rentalDays} day{rentalDays !== 1 && 's'}</span></p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4">
                <Button size="lg" variant="outline" onClick={() => setIsChatbotOpen(true)} className="w-full sm:w-auto">
                  <MessageCircle className="mr-2 h-5 w-5" /> Negotiate Price
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleBookWithRazorpay} 
                  className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={isBookingLoading || !dateRange?.from || !dateRange?.to || !isRazorpayScriptLoaded || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
                >
                  {isBookingLoading && <Loader2 className="animate-spin mr-2" />}
                  <CreditCard className="mr-2 h-5 w-5" /> 
                  {isBookingLoading ? 'Processing...' : 'Book & Pay'}
                </Button>
              </div>
              {!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && <p className="text-xs text-destructive text-center mt-2">Razorpay payments are currently disabled due to missing configuration.</p>}
            </CardFooter>
          </div>
        </div>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary flex items-center">
            <CalendarDays className="mr-2 h-6 w-6 text-accent" /> General Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This model is generally available from {new Date(car.availability[0].startDate).toLocaleDateString()} to {new Date(car.availability[0].endDate).toLocaleDateString()}.
            Please use the date picker above to select specific dates for your rental. Availability will be checked upon booking.
          </p>
        </CardContent>
      </Card>

      {isChatbotOpen && car && (
         <ChatbotDialog 
            isOpen={isChatbotOpen} 
            onOpenChange={setIsChatbotOpen} 
            car={car} 
            rentalDays={rentalDays > 0 ? rentalDays : 1} 
         />
      )}
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
}

function InfoItem({ icon, label }: InfoItemProps) {
  return (
    <div className="flex items-center">
      {icon}
      <span className="ml-2 text-foreground/90">{label}</span>
    </div>
  );
}
