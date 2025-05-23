
"use client";

import type { Car } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Gauge, GitCommitVertical, Fuel, Star, Clock, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useCallback } from 'react';

interface CarCardProps {
  car: Car;
  isFavorite?: boolean;
  onToggleFavorite?: (carId: string, isCurrentlyFavorite: boolean) => Promise<void>;
  isAuthenticated?: boolean;
}

const SLIDER_INTERVAL = 4000; // 4 seconds

export default function CarCard({ car, isFavorite, onToggleFavorite, isAuthenticated }: CarCardProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = car.imageUrls && car.imageUrls.length > 0 
    ? car.imageUrls 
    : ['/assets/images/default-car.png'];

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length > 1) {
      const timer = setTimeout(nextImage, SLIDER_INTERVAL);
      return () => clearTimeout(timer);
    }
  }, [currentImageIndex, images.length, nextImage]);

  const displayPrice = typeof car.pricePerHour === 'number' 
    ? car.pricePerHour.toFixed(2) 
    : 'N/A';

  const handleViewDetails = () => {
    router.push(`/cars/${car.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (onToggleFavorite && isAuthenticated) {
      onToggleFavorite(car.id, !!isFavorite);
    } else if (!isAuthenticated && onToggleFavorite) {
      router.push('/login?redirect=' + window.location.pathname);
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-0 relative">
        <div className="aspect-video relative w-full group">
          <Image 
            src={images[currentImageIndex]} 
            alt={`${car.name} - image ${currentImageIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-opacity duration-500 ease-in-out"
            data-ai-hint={car.aiHint || 'car'}
            priority={false}
            key={images[currentImageIndex]} // Force re-render for transition
            onError={(e) => { 
              (e.target as HTMLImageElement).src = '/assets/images/default-car.png';
              (e.target as HTMLImageElement).alt = 'Image failed to load';
            }}
          />
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-1 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all duration-300",
                      currentImageIndex === index ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {isAuthenticated && onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/70 hover:bg-background rounded-full h-8 w-8 z-10"
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
