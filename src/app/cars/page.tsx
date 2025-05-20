
"use client";

import CarCard from '@/components/CarCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Car as CarType } from '@/types';
import { Car, Filter, Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function CarsPage() {
  const [allCarTypes, setAllCarTypes] = useState<string[]>(['all']);
  const [displayedCars, setDisplayedCars] = useState<CarType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [carTypeFilter, setCarTypeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch unique car types for the filter dropdown
  useEffect(() => {
    const fetchCarTypes = async () => {
      try {
        // This could be a dedicated endpoint or derived from an initial full car list
        // For simplicity, we'll fetch all cars once to get types
        const response = await fetch('/api/cars');
        if (!response.ok) {
          throw new Error('Failed to fetch initial car data for types');
        }
        const data: CarType[] = await response.json();
        const uniqueTypes = ['all', ...Array.from(new Set(data.map(car => car.type)))];
        setAllCarTypes(uniqueTypes);
      } catch (error: any) {
        toast({ title: "Error fetching car types", description: error.message, variant: "destructive" });
      }
    };
    fetchCarTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Fetch cars based on filters
  const fetchFilteredCars = useCallback(async () => {
    setIsLoading(true);
    const queryParams = new URLSearchParams();

    if (debouncedSearchTerm) {
      queryParams.append('search', debouncedSearchTerm);
    }
    if (carTypeFilter !== 'all') {
      queryParams.append('type', carTypeFilter);
    }
    if (priceFilter !== 'all') {
      const [minStr, maxStr] = priceFilter.split('-');
      const min = Number(minStr);
      if (!isNaN(min)) {
        queryParams.append('minPrice', String(min));
      }
      if (maxStr) { // maxStr could be empty for "100-"
        const max = Number(maxStr);
        if (!isNaN(max)) {
          queryParams.append('maxPrice', String(max));
        }
      }
    }

    try {
      const response = await fetch(`/api/cars?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch cars and parse error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: CarType[] = await response.json();
      setDisplayedCars(data);
    } catch (error: any) {
      toast({ title: "Error fetching cars", description: error.message, variant: "destructive" });
      setDisplayedCars([]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, carTypeFilter, priceFilter, toast]);

  useEffect(() => {
    fetchFilteredCars();
  }, [fetchFilteredCars]);


  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: '$0 - $50', value: '0-50' },
    { label: '$50 - $100', value: '50-100' },
    { label: '$100+', value: '100-' }, 
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
            <Select value={carTypeFilter} onValueChange={setCarTypeFilter}>
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
            <Label htmlFor="priceRange" className="text-sm font-medium">Price Range (per day)</Label>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
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

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      ) : displayedCars.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCars.map(car => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
        <div className="text-center py-10">
          <Filter className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">
            No cars match your current filters.
          </p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}

