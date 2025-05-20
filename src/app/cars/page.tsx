
"use client";

import CarCard from '@/components/CarCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Car as CarType } from '@/types';
import { Car, Filter, Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function CarsPage() {
  const [allCars, setAllCars] = useState<CarType[]>([]); 
  const [displayedCars, setDisplayedCars] = useState<CarType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [carTypeFilter, setCarTypeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const fetchCarsData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/cars');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch cars and parse error' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data: CarType[] = await response.json();
        setAllCars(data);
        setDisplayedCars(data); 
      } catch (error: any) {
        toast({ title: "Error fetching cars", description: error.message, variant: "destructive" });
        setAllCars([]); 
        setDisplayedCars([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCarsData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Reduced debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);


  useEffect(() => {
    if (isLoading) return; 
    let filteredCars = allCars;

    if (debouncedSearchTerm) {
      filteredCars = filteredCars.filter(car => 
        car.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        car.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (car.longDescription && car.longDescription.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }

    if (carTypeFilter !== 'all') {
      filteredCars = filteredCars.filter(car => car.type === carTypeFilter);
    }

    if (priceFilter !== 'all') {
      const [minStr, maxStr] = priceFilter.split('-');
      const min = Number(minStr);
      const max = maxStr ? Number(maxStr) : Infinity; // Handle '100-' as 100 to Infinity
      filteredCars = filteredCars.filter(car => car.pricePerDay >= min && (max === Infinity ? true : car.pricePerDay <= max));
    }
    
    setDisplayedCars(filteredCars);
  }, [debouncedSearchTerm, carTypeFilter, priceFilter, allCars, isLoading]);


  const carTypes = ['all', ...Array.from(new Set(allCars.map(car => car.type)))];
  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: '$0 - $50', value: '0-50' },
    { label: '$50 - $100', value: '50-100' },
    { label: '$100+', value: '100-' }, // Representing $100 and above
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
                {carTypes.map(type => (
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
          {/* Date filter placeholder, can be implemented with Calendar component 
          <div>
            <Label htmlFor="dateRange" className="text-sm font-medium">Date Range</Label>
            <Input id="dateRange" type="text" placeholder="Select dates (coming soon)" disabled className="mt-1" />
          </div>
          */}
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
            {allCars.length === 0 ? "No cars available at the moment." : "No cars match your current filters."}
          </p>
          {allCars.length > 0 && <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filter criteria.</p>}
        </div>
      )}
    </div>
  );
}
