
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Car, SiteSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, DollarSign, Fuel, Gauge, GitCommitVertical, MapPin, MessageCircle, Users, Loader2, AlertTriangle, Star, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ChatbotDialog from '@/components/ChatbotDialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInCalendarDays, isBefore, startOfToday } from "date-fns";
import { cn } from '@/lib/utils';
import type { DateRange } from "react-day-picker";

interface CarDetailsPageProps {
  params: { id: string };
}

export default function CarDetailsPage({ params }: CarDetailsPageProps) {
  const [car, setCar] = useState<Car | null>(null);
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings>>({ defaultCurrency: 'USD' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const { toast } = useToast();

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
        console.warn("Could not fetch site settings for currency display, defaulting to USD.", settingsError);
      }
    };

    if (params.id) {
      fetchCarDetails();
      fetchSiteSettings();
    }
  }, [params.id]);

  const handleBookNow = async () => {
    if (!car || !dateRange?.from || !dateRange?.to) {
      toast({
        title: "Missing Information",
        description: "Please select a car and a valid date range to book.",
        variant: "destructive",
      });
      return;
    }

    if (isBefore(dateRange.from, today) || (dateRange.to && isBefore(dateRange.to, dateRange.from))) {
         toast({
            title: "Invalid Dates",
            description: "Please select valid future dates for your rental.",
            variant: "destructive",
        });
        return;
    }
    
    setIsBookingLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Error", description: "Please log in to make a booking.", variant: "destructive" });
      setIsBookingLoading(false);
      // Optionally redirect to login: router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          carId: car.id,
          startDate: format(dateRange.from, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"), // ISO format
          endDate: format(dateRange.to, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),     // ISO format
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create booking.');
      }
      
      toast({
        title: "Booking Confirmed!",
        description: `Your booking for ${car.name} from ${format(dateRange.from, "PPP")} to ${format(dateRange.to, "PPP")} is confirmed.`,
        duration: 5000,
      });
      // Optionally, clear date range or redirect to a "my bookings" page
      setDateRange({ from: undefined, to: undefined });

    } catch (bookingError: any) {
      toast({
        title: "Booking Failed",
        description: bookingError.message || "Could not complete your booking. Please try again.",
        variant: "destructive",
      });
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
    return ( // Should ideally be caught by error state, but as a fallback
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
  const currencySymbol = siteSettings.defaultCurrency === 'INR' ? '₹' : siteSettings.defaultCurrency === 'EUR' ? '€' : siteSettings.defaultCurrency === 'GBP' ? '£' : '$';


  return (
    <div className="space-y-8 container mx-auto py-8 px-4">
      <Card className="overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-video md:aspect-auto min-h-[300px] md:min-h-[400px]">
            <Image 
              src={car.imageUrl} 
              alt={car.name} 
              fill 
              className="object-cover"
              data-ai-hint={car.aiHint || 'car'}
              priority
            />
          </div>
          <div className="p-6 md:p-8 flex flex-col">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{car.name}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">{car.type}</CardDescription>
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
                <p className="text-3xl font-bold text-primary">{currencySymbol}{car.pricePerDay.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">per day ({siteSettings.defaultCurrency})</span></p>
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
                  onClick={handleBookNow} 
                  className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={isBookingLoading || !dateRange?.from || !dateRange?.to}
                >
                  {isBookingLoading && <Loader2 className="animate-spin mr-2" />}
                  <DollarSign className="mr-2 h-5 w-5" /> 
                  {isBookingLoading ? 'Processing...' : 'Book Now'}
                </Button>
              </div>
            </CardFooter>
          </div>
        </div>
      </Card>

      {/* General Availability Info - Note: This is static as per car data, not real-time */}
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

      <ChatbotDialog 
        isOpen={isChatbotOpen} 
        onOpenChange={setIsChatbotOpen} 
        car={car} 
        rentalDays={rentalDays > 0 ? rentalDays : undefined}
      />
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

