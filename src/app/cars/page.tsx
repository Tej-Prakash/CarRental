
"use client";

import CarCard from '@/components/CarCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Car as CarType, User } from '@/types'; 
import { Car, Filter, Search, Loader2, CalendarIcon, MapPin } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; 
import PaginationControls from '@/components/PaginationControls';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format, addDays, parse, setHours, setMinutes, isValid, isBefore, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 9;

export default function CarsPage() {
  const [allCarTypes, setAllCarTypes] = useState<string[]>(['all']);
  const [displayedCars, setDisplayedCars] = useState<CarType[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // For name/keyword
  const [carTypeFilter, setCarTypeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all'); 
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter(); 
  
  const [currentUserFavoriteIds, setCurrentUserFavoriteIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // New state for location and date-time search
  const [locationSearch, setLocationSearch] = useState('');
  const today = startOfToday();
  const [searchDateRange, setSearchDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [searchStartTime, setSearchStartTime] = useState<string>('09:00');
  const [searchEndTime, setSearchEndTime] = useState<string>('17:00');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // State to hold applied search criteria for API call
  const [appliedSearchCriteria, setAppliedSearchCriteria] = useState({
    debouncedSearchTerm: searchTerm,
    carType: carTypeFilter,
    price: priceFilter,
    location: locationSearch,
    startDate: '',
    endDate: '',
  });


  useEffect(() => {
    const handler = setTimeout(() => {
      setAppliedSearchCriteria(prev => ({...prev, debouncedSearchTerm: searchTerm}));
      setCurrentPage(1); 
    }, 500); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [carTypeFilter, priceFilter, locationSearch]);


  const fetchInitialData = useCallback(async () => {
    try {
      const carTypesResponse = await fetch('/api/cars?limit=1000'); 
      if (!carTypesResponse.ok) throw new Error('Failed to fetch initial car data for types');
      const carsResult = await carTypesResponse.json();
      const uniqueTypes = ['all', ...Array.from(new Set(carsResult.data.map((car: CarType) => car.type)))];
      setAllCarTypes(uniqueTypes);
    } catch (error: any) {
      toast({ title: "Error fetching car types", description: error.message, variant: "destructive" });
    }

    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      try {
        const profileResponse = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileResponse.ok) {
          const user: User = await profileResponse.json();
          setCurrentUserFavoriteIds(user.favoriteCarIds || []);
        } else if (profileResponse.status === 401) {
          localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); setIsAuthenticated(false);
        }
      } catch (error: any) {
        console.error("Failed to fetch user profile for favorites:", error.message);
      }
    } else {
      setIsAuthenticated(false);
      setCurrentUserFavoriteIds([]);
    }
  }, [toast]);


  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchFilteredCars = useCallback(async (page = 1, criteria = appliedSearchCriteria) => {
    setIsLoading(true);
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(ITEMS_PER_PAGE),
    });

    if (criteria.debouncedSearchTerm) queryParams.append('search', criteria.debouncedSearchTerm);
    if (criteria.carType !== 'all') queryParams.append('type', criteria.carType);
    
    if (criteria.price !== 'all') {
      const [minStr, maxStr] = criteria.price.split('-');
      const min = Number(minStr);
      if (!isNaN(min)) queryParams.append('minPrice', String(min)); 
      if (maxStr) {
        const max = Number(maxStr);
        if (!isNaN(max)) queryParams.append('maxPrice', String(max)); 
      }
    }
    if (criteria.location) queryParams.append('location', criteria.location);
    if (criteria.startDate) queryParams.append('searchStartDate', criteria.startDate);
    if (criteria.endDate) queryParams.append('searchEndDate', criteria.endDate);


    try {
      const response = await fetch(`/api/cars?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch cars and parse error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDisplayedCars(data.data);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error: any) {
      toast({ title: "Error fetching cars", description: error.message, variant: "destructive" });
      setDisplayedCars([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [toast, appliedSearchCriteria]);

  useEffect(() => {
    fetchFilteredCars(currentPage, appliedSearchCriteria);
  }, [fetchFilteredCars, currentPage, appliedSearchCriteria]);

  const handleSearchButtonClick = () => {
    let finalStartDateISO = '';
    let finalEndDateISO = '';

    if (searchDateRange?.from && searchStartTime) {
        const [startH, startM] = searchStartTime.split(':').map(Number);
        let tempStart = setMinutes(setHours(searchDateRange.from, startH), startM);
        if (isValid(tempStart)) {
            finalStartDateISO = tempStart.toISOString();
        } else {
            toast({ title: "Invalid Start Time", description: "Please select a valid start time.", variant: "destructive" });
            return;
        }
    }
    if (searchDateRange?.to && searchEndTime) {
        const [endH, endM] = searchEndTime.split(':').map(Number);
        let tempEnd = setMinutes(setHours(searchDateRange.to, endH), endM);
         if (isValid(tempEnd)) {
            finalEndDateISO = tempEnd.toISOString();
        } else {
            toast({ title: "Invalid End Time", description: "Please select a valid end time.", variant: "destructive" });
            return;
        }
    }
    
    if (finalStartDateISO && finalEndDateISO && isBefore(parseISO(finalEndDateISO), parseISO(finalStartDateISO))) {
        toast({ title: "Invalid Date/Time Range", description: "End date/time must be after start date/time.", variant: "destructive" });
        return;
    }
    
    if (finalStartDateISO && isBefore(parseISO(finalStartDateISO), new Date())) {
      toast({ title: "Invalid Start Date/Time", description: "Start date/time cannot be in the past.", variant: "destructive" });
      return;
    }


    setAppliedSearchCriteria({
        debouncedSearchTerm: searchTerm,
        carType: carTypeFilter,
        price: priceFilter,
        location: locationSearch,
        startDate: finalStartDateISO,
        endDate: finalEndDateISO,
    });
    setCurrentPage(1); // Reset to page 1 on new search
  };

  const handleToggleFavorite = async (carId: string, isCurrentlyFavorite: boolean) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Required", description: "Please log in to manage favorites.", variant: "destructive" });
      router.push('/login?redirect=/cars'); 
      return;
    }

    const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
    const url = isCurrentlyFavorite ? `/api/profile/favorites/${carId}` : '/api/profile/favorites';
    const body = isCurrentlyFavorite ? null : JSON.stringify({ carId });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
    } catch (error: any) {
      toast({ title: "Error Updating Favorites", description: error.message, variant: "destructive" });
    }
  };

  const priceRanges = [ 
    { label: 'All Prices', value: 'all' },
    { label: '₹0 - ₹20', value: '0-20' }, 
    { label: '₹20 - ₹50', value: '20-50' },
    { label: '₹50+', value: '50-' }, 
  ];

  return (
    <div className="space-y-8 container mx-auto py-8 px-4">
      <section className="bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center">
          <Car className="h-8 w-8 mr-3 text-accent" />
          Find Your Perfect Ride
        </h1>
        <p className="text-muted-foreground mb-6">Search by location, date, time, and other preferences.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Location Search */}
          <div>
            <Label htmlFor="locationSearch" className="text-sm font-medium">Location</Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                id="locationSearch" 
                type="text" 
                placeholder="e.g., Airport, Downtown" 
                className="pl-10"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Date Range Picker */}
          <div>
            <Label htmlFor="date-range-picker-trigger" className="text-sm font-medium">Dates</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date-range-picker-trigger"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !searchDateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {searchDateRange?.from ? (
                    searchDateRange.to ? (
                      <>
                        {format(searchDateRange.from, "LLL dd, y")} - {format(searchDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(searchDateRange.from, "LLL dd, y")
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
                  defaultMonth={searchDateRange?.from}
                  selected={searchDateRange}
                  onSelect={(selectedRange) => {
                    setSearchDateRange(selectedRange);
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
          
          {/* Time Pickers */}
          <div className="grid grid-cols-2 gap-2">
            <div>
                <Label htmlFor="searchStartTime" className="text-sm font-medium">Start Time</Label>
                <Input type="time" id="searchStartTime" value={searchStartTime} onChange={(e) => setSearchStartTime(e.target.value)} className="w-full mt-1" disabled={!searchDateRange?.from}/>
            </div>
            <div>
                <Label htmlFor="searchEndTime" className="text-sm font-medium">End Time</Label>
                <Input type="time" id="searchEndTime" value={searchEndTime} onChange={(e) => setSearchEndTime(e.target.value)} className="w-full mt-1" disabled={!searchDateRange?.to}/>
            </div>
          </div>


          {/* Existing Filters: SearchTerm, Type, Price */}
          <div>
            <Label htmlFor="search" className="text-sm font-medium">Keyword (Name/Desc)</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                id="search" 
                type="text" 
                placeholder="e.g., Toyota Camry, SUV" 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="carType" className="text-sm font-medium">Car Type</Label>
            <Select value={carTypeFilter} onValueChange={(value) => {setCarTypeFilter(value); setCurrentPage(1);}}>
              <SelectTrigger id="carType" className="mt-1">
                <SelectValue placeholder="Select car type" />
              </SelectTrigger>
              <SelectContent>
                {allCarTypes.map(type => (
                  <SelectItem key={type} value={type}>{type === 'all' ? 'All Types' : type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priceRange" className="text-sm font-medium">Price Range (per hour)</Label>
            <Select value={priceFilter} onValueChange={(value) => {setPriceFilter(value); setCurrentPage(1);}}>
              <SelectTrigger id="priceRange" className="mt-1">
                <SelectValue placeholder="Select price range" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
            <Button onClick={handleSearchButtonClick} disabled={isLoading}>
                <Search className="mr-2 h-4 w-4"/> Search Cars
            </Button>
        </div>
      </section>

      {isLoading && displayedCars.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      ) : !isLoading && displayedCars.length === 0 ? (
        <div className="text-center py-10">
          <Filter className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">
            No cars match your current filters.
          </p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCars.map(car => (
                <CarCard 
                    key={car.id} 
                    car={car} 
                    isFavorite={currentUserFavoriteIds.includes(car.id)}
                    onToggleFavorite={handleToggleFavorite}
                    isAuthenticated={isAuthenticated}
                />
                ))}
            </div>
            {totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            )}
          </>
        )}
    </div>
  );
}

