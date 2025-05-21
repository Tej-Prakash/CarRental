
"use client";

import type { Car } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Gauge, GitCommitVertical, Fuel, Star, Clock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarCardProps {
  car: Car;
  isFavorite?: boolean;
  onToggleFavorite?: (carId: string, isCurrentlyFavorite: boolean) => Promise<void>;
  isAuthenticated?: boolean;
}

export default function CarCard({ car, isFavorite, onToggleFavorite, isAuthenticated }: CarCardProps) {
  const router = useRouter();

  const primaryImageUrl = car.imageUrls && car.imageUrls.length > 0 
    ? car.imageUrls[0] 
    : '/assets/images/default-car.png';
  
  const displayPrice = typeof car.pricePerHour === 'number' 
    ? car.pricePerHour.toFixed(2) 
    : 'N/A';

  const handleViewDetails = () => {
    router.push(`/cars/${car.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when favorite button is clicked
    if (onToggleFavorite && isAuthenticated) {
      onToggleFavorite(car.id, !!isFavorite);
    } else if (!isAuthenticated && onToggleFavorite) {
      // Optionally redirect to login or show a toast
      router.push('/login?redirect=' + window.location.pathname);
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-0 relative">
        <div className="aspect-video relative w-full">
          <Image 
            src={primaryImageUrl} 
            alt={car.name} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={car.aiHint || 'car'}
            priority={false}
            onError={(e) => { 
              (e.target as HTMLImageElement).src = '/assets/images/default-car.png';
              (e.target as HTMLImageElement).alt = 'Image failed to load';
            }}
          />
        </div>
        {isAuthenticated && onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/70 hover:bg-background rounded-full h-8 w-8"
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("h-5 w-5", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500")} />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-semibold text-primary mb-1">{car.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-3">{car.type}</CardDescription>
        <p className="text-sm text-foreground/80 mb-4 line-clamp-2 h-10">{car.description}</p>
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
      <CardFooter className="p-4 flex justify-between items-center border-t mt-auto">
        <div>
          <p className="text-lg font-bold text-primary flex items-center">
            <Clock className="h-4 w-4 mr-1 text-accent" /> ₹{displayPrice}
          </p>
          <p className="text-xs text-muted-foreground ml-1">per hour</p>
        </div>
        <Button variant="default" onClick={handleViewDetails}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
