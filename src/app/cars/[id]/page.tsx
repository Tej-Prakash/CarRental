
"use client";

import React, { useState, useEffect, use, ChangeEvent } from 'react';
import Image from 'next/image';
import type { Car, SiteSettings, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Clock, Fuel, Gauge, GitCommitVertical, MapPin, MessageCircle, Users, Loader2, AlertTriangle, Star, CalendarDays, Info, ShoppingCart, Image as ImageIcon, ShieldCheck, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ChatbotDialog from '@/components/ChatbotDialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInHours, isBefore, startOfToday, parseISO, setHours, setMinutes, isValid, addHours } from "date-fns";
import { cn } from '@/lib/utils';
import type { DateRange } from "react-day-picker";
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface CarDetailsPageProps {
  params: { id: string };
}

export default function CarDetailsPage({ params: paramsFromProps }: CarDetailsPageProps) {
  const params = use(paramsFromProps as any); 
  const carId = params.id;

  const [car, setCar] = useState<Car | null>(null);
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings>>({ defaultCurrency: 'INR' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isProceedingToCheckout, setIsProceedingToCheckout] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const today = startOfToday();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined, 
    to: undefined,  
  });
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [selectedStartDateTime, setSelectedStartDateTime] = useState<Date | null>(null);
  const [selectedEndDateTime, setSelectedEndDateTime] = useState<Date | null>(null);
  const [currentMainImage, setCurrentMainImage] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState<boolean | null>(null);
  const [isCheckingUserVerification, setIsCheckingUserVerification] = useState(false);
  const [currentUserFavoriteIds, setCurrentUserFavoriteIds] = useState<string[]>([]);


  const fetchCarDetails = useCallback(async () => {
    if (!carId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cars/${carId}`);
      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); router.push('/login');
        } else {
          const errorData = await response.json().catch(() => ({ message: `Car not found or server error (${response.status})` }));
          throw new Error(errorData.message);
        }
        setCar(null); setIsLoading(false); return;
      }
      const data: Car = await response.json();
      setCar(data);
      if (data.imageUrls && data.imageUrls.length > 0) {
          setCurrentMainImage(data.imageUrls[0]);
      } else {
          setCurrentMainImage('/assets/images/default-car.png');
      }
    } catch (err: any) {
      setError(err.message); setCar(null);
    } finally {
      setIsLoading(false);
    }
  }, [carId, router, toast]);

  const fetchUserProfileData = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsAuthenticated(false);
      setIsUserVerified(null);
      setCurrentUserFavoriteIds([]);
      return;
    }
    setIsAuthenticated(true);
    setIsCheckingUserVerification(true);
    try {
      const response = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); setIsAuthenticated(false);
          setCurrentUserFavoriteIds([]);
        }
        throw new Error('Failed to fetch user profile.');
      }
      const user: User = await response.json();
      const photoId = user.documents?.find(doc => doc.type === 'PhotoID');
      const drivingLicense = user.documents?.find(doc => doc.type === 'DrivingLicense');
      
      setIsUserVerified(photoId?.status === 'Approved' && drivingLicense?.status === 'Approved');
      setCurrentUserFavoriteIds(user.favoriteCarIds || []);
    } catch (error) {
      console.error("Error fetching user profile data:", error);
      setIsUserVerified(false); 
      setCurrentUserFavoriteIds([]);
      // toast({ title: "Profile Check Failed", description: "Could not retrieve your profile details.", variant: "destructive" });
    } finally {
      setIsCheckingUserVerification(false);
    }
  }, []);


  useEffect(() => {
    if (carId) {
        fetchCarDetails();
    }
    fetchUserProfileData(); // Fetch profile for favorite status and verification

    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) setSiteSettings(await response.json());
        else setSiteSettings({ defaultCurrency: 'INR' });
      } catch (settingsError) {
        console.warn("Could not fetch site settings, defaulting to INR.", settingsError);
        setSiteSettings({ defaultCurrency: 'INR' });
      }
    };
    fetchSiteSettings();
  }, [carId, fetchCarDetails, fetchUserProfileData]);


  useEffect(() => {
    if (dateRange?.from && dateRange?.to && startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);

      let tempStartDateTime = setMinutes(setHours(dateRange.from, startH), startM);
      let tempEndDateTime = setMinutes(setHours(dateRange.to, endH), endM);
      
      if (isValid(tempStartDateTime) && isValid(tempEndDateTime)) {
        if (isBefore(tempEndDateTime, tempStartDateTime) || tempEndDateTime.getTime() === tempStartDateTime.getTime()) {
           if (dateRange.to.getTime() === dateRange.from.getTime()) { 
            if (tempEndDateTime <= tempStartDateTime) {
                tempEndDateTime = addHours(tempStartDateTime, 1);
                setEndTime(format(tempEndDateTime, 'HH:mm')); 
                if (dateRange.to.getDate() !== tempEndDateTime.getDate()){
                     setDateRange(prev => ({...prev, to: tempEndDateTime}));
                }
            }
          }
        }
        if (isBefore(tempStartDateTime, new Date())) {
            setSelectedStartDateTime(null);
            setSelectedEndDateTime(null);
            toast({title: "Invalid Time", description: "Start date and time cannot be in the past.", variant: "destructive"});
            return;
        }
        setSelectedStartDateTime(tempStartDateTime);
        setSelectedEndDateTime(tempEndDateTime);
      } else {
        setSelectedStartDateTime(null);
        setSelectedEndDateTime(null);
      }
    } else {
      setSelectedStartDateTime(null);
      setSelectedEndDateTime(null);
    }
  }, [dateRange, startTime, endTime, toast]);


  const handleProceedToCheckout = () => {
    if (!car || !selectedStartDateTime || !selectedEndDateTime) {
      toast({ title: "Missing Information", description: "Please select a car and a valid date-time range.", variant: "destructive" });
      return;
    }
    if (!isValid(selectedStartDateTime) || !isValid(selectedEndDateTime) || isBefore(selectedEndDateTime, selectedStartDateTime) || selectedEndDateTime.getTime() === selectedStartDateTime.getTime()) {
      toast({ title: "Invalid Dates/Times", description: "Please select a valid future date-time range. End time must be after start time.", variant: "destructive" });
      return;
    }
    if (isBefore(selectedStartDateTime, new Date())) {
        toast({ title: "Invalid Start Time", description: "Start date and time cannot be in the past.", variant: "destructive" });
        return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Required", description: "Please log in to make a booking.", variant: "destructive" });
      localStorage.removeItem('checkoutBookingDetails');
      router.push(`/login?redirect=/cars/${carId}`);
      return;
    }

    if (isUserVerified === false) {
      toast({
        title: "Document Verification Required",
        description: "Please complete your Photo ID and Driving License verification in your profile to proceed.",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    if (isUserVerified === null && isCheckingUserVerification) {
        toast({ title: "Verification Check in Progress", description: "Please wait while we verify your document status.", variant: "default" });
        return;
    }


    setIsProceedingToCheckout(true);

    const rentalHours = differenceInHours(selectedEndDateTime, selectedStartDateTime);
    if (rentalHours <= 0) {
      toast({ title: "Invalid Duration", description: "Rental duration must be at least 1 hour.", variant: "destructive" });
      setIsProceedingToCheckout(false);
      return;
    }
    const totalPrice = rentalHours * car.pricePerHour;
    const primaryImageForCheckout = car.imageUrls && car.imageUrls.length > 0 ? car.imageUrls[0] : '/assets/images/default-car.png';

    const checkoutDetails = {
      carId: car.id,
      carName: car.name,
      carImageUrl: primaryImageForCheckout,
      startDate: selectedStartDateTime.toISOString(),
      endDate: selectedEndDateTime.toISOString(),
      rentalHours,
      pricePerHour: car.pricePerHour,
      totalPrice,
      currency: siteSettings.defaultCurrency || 'INR',
      currencySymbol: siteSettings.defaultCurrency === 'INR' ? '₹' : siteSettings.defaultCurrency === 'EUR' ? '€' : siteSettings.defaultCurrency === 'GBP' ? '£' : '$',
    };

    localStorage.setItem('checkoutBookingDetails', JSON.stringify(checkoutDetails));
    router.push('/checkout');
  };

  const handleToggleFavorite = async () => {
    if (!car) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/cars/' + car.id);
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) return; // Should be caught by isAuthenticated, but defensive

    const isCurrentlyFavorite = currentUserFavoriteIds.includes(car.id);
    const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
    const url = isCurrentlyFavorite ? `/api/profile/favorites/${car.id}` : '/api/profile/favorites';
    const body = isCurrentlyFavorite ? null : JSON.stringify({ carId: car.id });

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update favorite status.' }));
        throw new Error(errorData.message);
      }
      const { favoriteCarIds: updatedFavoriteIds } = await response.json();
      setCurrentUserFavoriteIds(updatedFavoriteIds || []);
      toast({
        title: isCurrentlyFavorite ? "Removed from Favorites" : "Added to Favorites",
      });
    } catch (favError: any) {
      toast({ title: "Error Updating Favorites", description: favError.message, variant: "destructive" });
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
  
  const rentalHours = selectedStartDateTime && selectedEndDateTime && isValid(selectedStartDateTime) && isValid(selectedEndDateTime) && isBefore(selectedStartDateTime, selectedEndDateTime)
    ? differenceInHours(selectedEndDateTime, selectedStartDateTime) 
    : 0;
  const totalPrice = rentalHours > 0 ? rentalHours * car.pricePerHour : 0;
  
  const displayCurrency = siteSettings.defaultCurrency || 'INR';
  const currencySymbol = displayCurrency === 'INR' ? '₹' : displayCurrency === 'EUR' ? '€' : displayCurrency === 'GBP' ? '£' : '$'; 
  
  const isCarFavorite = isAuthenticated && currentUserFavoriteIds.includes(car.id);

  return (
    <div className="space-y-8 container mx-auto py-8 px-4">
      <Card className="overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-4 md:p-6">
             {currentMainImage && (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-md mb-4">
                    <Image 
                    src={currentMainImage} 
                    alt={car.name} 
                    fill 
                    className="object-cover"
                    data-ai-hint={car.aiHint || 'car'}
                    priority
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/default-car.png'; (e.target as HTMLImageElement).alt = "Image error, fallback shown"; }}
                    />
                </div>
            )}
            {(car.imageUrls && car.imageUrls.length > 1) && (
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">More Images:</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {car.imageUrls.map((imgUrl, index) => (
                            <button 
                                key={index} 
                                className={cn(
                                    "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                                    imgUrl === currentMainImage ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-primary/50"
                                )}
                                onClick={() => setCurrentMainImage(imgUrl)}
                            >
                                <Image 
                                    src={imgUrl} 
                                    alt={`${car.name} - image ${index + 1}`} 
                                    fill 
                                    className="object-cover" 
                                    sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, 15vw"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/default-car.png'; }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
             {(!car.imageUrls || car.imageUrls.length === 0) && !currentMainImage && (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-md mb-4 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                </div>
            )}
          </div>
          <div className="p-6 md:p-8 flex flex-col">
            <CardHeader className="p-0 mb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{car.name}</CardTitle>
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleFavorite}
                    aria-label={isCarFavorite ? "Remove from favorites" : "Add to favorites"}
                    className="h-10 w-10 rounded-full"
                  >
                    <Heart className={cn("h-6 w-6", isCarFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500")} />
                  </Button>
                )}
              </div>
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

            <CardFooter className="p-0 mt-6 pt-6 border-t flex flex-col items-start gap-4">
              <div className="w-full">
                <h3 className="font-semibold text-md mb-2 text-primary">Select Rental Period:</h3>
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="date-range-picker-trigger" className="text-sm font-medium text-muted-foreground">Dates</Label>
                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                            <PopoverTrigger asChild>
                            <Button
                                id="date-range-picker-trigger"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal mt-1",
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
                                <span>Pick dates</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(selectedRange) => {
                                    setDateRange(selectedRange);
                                    if (selectedRange?.from && selectedRange.to) {
                                        setIsDatePickerOpen(false); 
                                    }
                                }}
                                numberOfMonths={1} 
                                disabled={{ before: today }}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startTime" className="text-sm font-medium text-muted-foreground">Start Time</Label>
                            <Input type="time" id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full mt-1" disabled={!dateRange?.from}/>
                        </div>
                        <div>
                            <Label htmlFor="endTime" className="text-sm font-medium text-muted-foreground">End Time</Label>
                            <Input type="time" id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full mt-1" disabled={!dateRange?.to}/>
                        </div>
                    </div>
                </div>

                {selectedStartDateTime && selectedEndDateTime && (
                     <p className="text-xs text-muted-foreground mt-2">
                        Selected: {format(selectedStartDateTime, "MMM dd, yyyy, hh:mm a")} to {format(selectedEndDateTime, "MMM dd, yyyy, hh:mm a")}
                    </p>
                )}
              </div>
              
              <div className="text-left w-full mt-2">
                <p className="text-3xl font-bold text-primary flex items-center">
                    <Clock className="h-6 w-6 mr-2 text-accent" /> {currencySymbol}{car.pricePerHour.toFixed(2)} 
                    <span className="text-sm font-normal text-muted-foreground ml-1">per hour ({displayCurrency})</span>
                </p>
                {rentalHours > 0 && (
                   <p className="text-xl font-semibold text-primary mt-1">Total: {currencySymbol}{totalPrice.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">for {rentalHours} hour{rentalHours !== 1 && 's'}</span></p>
                )}
              </div>
              
              {isAuthenticated && isUserVerified === false && !isCheckingUserVerification && (
                <Alert variant="destructive" className="w-full">
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Document Verification Required</AlertTitle>
                  <AlertDescription>
                    Your Photo ID and Driving License must be approved before you can book a car. 
                    Please visit your <Link href="/profile" className="font-semibold underline hover:text-destructive/80">profile</Link> to complete verification.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-2 w-full mt-4">
                <Button size="lg" variant="outline" onClick={() => setIsChatbotOpen(true)} className="w-full sm:w-auto">
                  <MessageCircle className="mr-2 h-5 w-5" /> Negotiate Price
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleProceedToCheckout} 
                  className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={
                    isProceedingToCheckout || 
                    !selectedStartDateTime || 
                    !selectedEndDateTime || 
                    rentalHours <= 0 ||
                    (isAuthenticated && isUserVerified === false) ||
                    isCheckingUserVerification
                  }
                >
                  {(isProceedingToCheckout || isCheckingUserVerification) && <Loader2 className="animate-spin mr-2" />}
                  <ShoppingCart className="mr-2 h-5 w-5" /> 
                  {isCheckingUserVerification ? 'Verifying...' : (isProceedingToCheckout ? 'Processing...' : 'Proceed to Checkout')}
                </Button>
              </div>
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
           {car.availability && car.availability.length > 0 ? (
            <p className="text-muted-foreground">
              This model is generally available from {format(parseISO(car.availability[0].startDate), "PP")} to {format(parseISO(car.availability[0].endDate), "PP")}.
              Please use the date & time picker above to select specific rental times. Availability will be checked upon booking.
            </p>
          ) : (
            <p className="text-muted-foreground">Availability information not specified for this car.</p>
          )}
        </CardContent>
      </Card>

      {isChatbotOpen && car && (
         <ChatbotDialog 
            isOpen={isChatbotOpen} 
            onOpenChange={setIsChatbotOpen} 
            car={car} 
            rentalHours={rentalHours > 0 ? rentalHours : 1} 
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
