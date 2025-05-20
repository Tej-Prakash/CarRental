
import type { Car } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Gauge, GitCommitVertical, Fuel, Star } from 'lucide-react';

interface CarCardProps {
  car: Car;
}

export default function CarCard({ car }: CarCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="aspect-video relative w-full">
          <Image 
            src={car.imageUrl} 
            alt={car.name} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={car.aiHint}
            priority={false} // Generally false for list items, true for hero/LCP images
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-semibold text-primary mb-1">{car.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-3">{car.type}</CardDescription>
        <p className="text-sm text-foreground/80 mb-4 line-clamp-2 h-10">{car.description}</p> {/* Fixed height for description */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center text-foreground/90">
            <Users className="h-4 w-4 mr-2 text-accent" /> {car.seats} Seats
          </div>
          <div className="flex items-center text-foreground/90">
            <Gauge className="h-4 w-4 mr-2 text-accent" /> {car.engine.substring(0,15)}{car.engine.length > 15 ? '...': ''}
          </div>
          <div className="flex items-center text-foreground/90">
            <GitCommitVertical className="h-4 w-4 mr-2 text-accent" /> {car.transmission}
          </div>
          <div className="flex items-center text-foreground/90">
            <Fuel className="h-4 w-4 mr-2 text-accent" /> {car.fuelType}
          </div>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
            <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
            {car.rating.toFixed(1)} ({car.reviews} reviews)
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center border-t mt-auto"> {/* Added mt-auto to push footer down */}
        <div>
          <p className="text-lg font-bold text-primary">${car.pricePerDay.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">per day</p>
        </div>
        <Button asChild variant="default">
          <Link href={`/cars/${car.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
