"use client";

import CarCard from '@/components/CarCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockCars } from '@/lib/mockData';
import { Car, Filter, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CarsPage() {
  const [cars, setCars] = useState(mockCars); // In a real app, fetch this data
  const [searchTerm, setSearchTerm] = useState('');
  const [carTypeFilter, setCarTypeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  
  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);


  // Filtering logic (client-side for this mock)
  useEffect(() => {
    let filteredCars = mockCars;

    if (debouncedSearchTerm) {
      filteredCars = filteredCars.filter(car => 
        car.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        car.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (carTypeFilter !== 'all') {
      filteredCars = filteredCars.filter(car => car.type === carTypeFilter);
    }

    if (priceFilter !== 'all') {
      const [min, max] = priceFilter.split('-').map(Number);
      filteredCars = filteredCars.filter(car => car.pricePerDay >= min && (max ? car.pricePerDay <= max : true));
    }
    
    setCars(filteredCars);
  }, [debouncedSearchTerm, carTypeFilter, priceFilter]);


  const carTypes = ['all', ...new Set(mockCars.map(car => car.type))];
  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: '$0 - $50', value: '0-50' },
    { label: '$50 - $100', value: '50-100' },
    { label: '$100+', value: '100-' },
  ];

  return (
    <div className="space-y-8">
      <section className="bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center">
          <Car className="h-8 w-8 mr-3 text-accent" />
          Browse Our Fleet
        </h1>
        <p className="text-muted-foreground mb-6">Find the perfect vehicle for your next adventure.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
          {/* Date filter placeholder, can be implemented with Calendar component */}
          <div>
            <Label htmlFor="dateRange" className="text-sm font-medium">Date Range</Label>
            <Input id="dateRange" type="text" placeholder="Select dates (coming soon)" disabled className="mt-1" />
          </div>
        </div>
      </section>

      {cars.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map(car => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <Filter className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No cars match your current filters.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
