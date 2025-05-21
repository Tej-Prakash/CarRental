
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Car, User } from '@/types';
import { Loader2, Heart, AlertTriangle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CarCard from '@/components/CarCard';

export default function MyFavoritesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserFavoriteIds, setCurrentUserFavoriteIds] = useState<string[]>([]);

  const fetchFavoriteCars = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Unauthorized", description: "Please log in to view your favorites.", variant: "destructive" });
      router.push('/login?redirect=/profile/favorites');
      setIsLoading(false);
      return;
    }

    try {
      // Fetch favorite cars
      const favResponse = await fetch('/api/profile/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!favResponse.ok) {
        if (favResponse.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); router.push('/login');
        } else {
          const errorData = await favResponse.json().catch(() => ({ message: "Failed to fetch your favorite cars." }));
          throw new Error(errorData.message);
        }
        return;
      }
      const favData: Car[] = await favResponse.json();
      setFavoriteCars(favData);
      setCurrentUserFavoriteIds(favData.map(car => car.id));

    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error Fetching Favorites", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchFavoriteCars();
  }, [fetchFavoriteCars]);


  const handleToggleFavorite = async (carId: string, isCurrentlyFavorite: boolean) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Required", description: "Please log in to manage favorites.", variant: "destructive" });
      router.push('/login?redirect=/profile/favorites');
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
      setCurrentUserFavoriteIds(updatedFavoriteIds || []); // Update the local list of favorite IDs
      
      // Refetch the full list of favorite cars to update the display
      // This is simpler than trying to manually add/remove from the favoriteCars state
      fetchFavoriteCars(); 
      
      toast({
        title: isCurrentlyFavorite ? "Removed from Favorites" : "Added to Favorites",
        description: `Car ${isCurrentlyFavorite ? 'removed from' : 'added to'} your favorites.`,
      });

    } catch (error: any) {
      toast({ title: "Error Updating Favorites", description: error.message, variant: "destructive" });
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
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchFavoriteCars} className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <Heart className="h-8 w-8 mr-3 text-accent fill-accent" /> My Favorite Cars
          </CardTitle>
          <CardDescription>Here are the cars you've marked as your favorites.</CardDescription>
        </CardHeader>
        <CardContent>
          {favoriteCars.length === 0 ? (
            <div className="text-center py-10">
              <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">You haven't favorited any cars yet.</p>
              <Button asChild className="mt-4">
                <a href="/cars">Browse Cars to Add Favorites</a>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteCars.map((car) => (
                <CarCard 
                  key={car.id} 
                  car={car}
                  isFavorite={currentUserFavoriteIds.includes(car.id)}
                  onToggleFavorite={handleToggleFavorite}
                  isAuthenticated={!!localStorage.getItem('authToken')}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
