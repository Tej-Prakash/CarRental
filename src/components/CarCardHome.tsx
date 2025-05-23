
"use client";

import type { Car } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Fuel, Settings2, Users2, CalendarDays } from 'lucide-react';
import Link from 'next/link';

interface CarCardHomeProps {
  car: Car;
}

export default function CarCardHome({ car }: CarCardHomeProps) {
  const displayPrice = typeof car.pricePerHour === 'number' 
    ? car.pricePerHour.toFixed(0)
    : 'N/A';
  
  const originalPrice = typeof car.pricePerHour === 'number' ? (car.pricePerHour * 1.25).toFixed(0) : null;
  const discount = originalPrice ? '20% OFF' : null; 

  const modelYear = car.availability?.[0]?.startDate ? new Date(car.availability[0].startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden transition-shadow hover:shadow-xl h-full flex flex-col">
      <div className="relative aspect-[4/3] w-full">
        <Image 
          src={(car.imageUrls && car.imageUrls.length > 0) ? car.imageUrls[0] : '/assets/images/default-car.png'}
          alt={car.name}
          fill
          className="object-cover"
          data-ai-hint={car.aiHint || 'car side'}
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 300px"
          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/default-car.png';}}
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md font-semibold text-primary truncate mb-1" title={car.name}>{car.name}</h3>
        <p className="text-xs text-muted-foreground mb-2">Model {modelYear}</p>
        
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
          <div className="flex items-center">
            <Fuel className="h-3.5 w-3.5 mr-1 text-accent" /> {car.fuelType}
          </div>
          <div className="flex items-center">
            <Settings2 className="h-3.5 w-3.5 mr-1 text-accent" /> {car.transmission}
          </div>
          <div className="flex items-center">
            <Users2 className="h-3.5 w-3.5 mr-1 text-accent" /> {car.seats} Seater
          </div>
        </div>
        
        <div className="mt-auto flex justify-between items-center">
          <div>
            <span className="text-lg font-bold text-primary">₹{displayPrice}</span>
            {originalPrice && discount && (
              <span className="ml-2 text-xs">
                <span className="line-through text-muted-foreground">₹{originalPrice}</span>
                <span className="text-green-600 font-semibold ml-1">{discount}</span>
              </span>
            )}
          </div>
          <Button size="sm" variant="default" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-4 py-1.5 text-xs">
            <Link href={`/cars/${car.id}`}>Book &gt;</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
