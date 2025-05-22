
"use client";

import CarCard from '@/components/CarCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Car as CarType, User } from '@/types'; 
import { Car, Filter, Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; 
import PaginationControls from '@/components/PaginationControls';

const ITEMS_PER_PAGE = 9;

export default function CarsPage() {
  const [allCarTypes, setAllCarTypes] = useState<string[]>(['all']);
  const [displayedCars, setDisplayedCars] = useState<CarType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [carTypeFilter, setCarTypeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all'); 
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter(); 
  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [currentUserFavoriteIds, setCurrentUserFavoriteIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset page on new search term
    }, 300); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [carTypeFilter, priceFilter]);


  const fetchInitialData = useCallback(async () => {
    // Fetch Car Types
    try {
      const carTypesResponse = await fetch('/api/cars?limit=1000'); 
      if (!carTypesResponse.ok) throw new Error('Failed to fetch initial car data for types');
      const carsResult = await carTypesResponse.json();
      const uniqueTypes = ['all', ...Array.from(new Set(carsResult.data.map((car: CarType) => car.type)))];
      setAllCarTypes(uniqueTypes);
    } catch (error: any) {
      toast({ title: "Error fetching car types", description: error.message, variant: "destructive" });
    }

    // Fetch User Profile (for favorites)
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

  const fetchFilteredCars = useCallback(async (page = 1) => {
    setIsLoading(true);
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(ITEMS_PER_PAGE),
    });

    if (debouncedSearchTerm) queryParams.append('search', debouncedSearchTerm);
    if (carTypeFilter !== 'all') queryParams.append('type', carTypeFilter);
    
    if (priceFilter !== 'all') {
      const [minStr, maxStr] = priceFilter.split('-');
      const min = Number(minStr);
      if (!isNaN(min)) queryParams.append('minPrice', String(min)); 
      if (maxStr) {
        const max = Number(maxStr);
        if (!isNaN(max)) queryParams.append('maxPrice', String(max)); 
      }
    }

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
  }, [debouncedSearchTerm, carTypeFilter, priceFilter, toast]);

  useEffect(() => {
    fetchFilteredCars(currentPage);
  }, [fetchFilteredCars, currentPage]);

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
          Browse Our Fleet
        </h1>
        <p className="text-muted-foreground mb-6">Find the perfect vehicle for your next adventure.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="search" className="text-sm font-medium">Search by Name/Keyword</Label>
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
