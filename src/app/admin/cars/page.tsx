
"use client";

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Car } from '@/types';
import Image from 'next/image';
import { PlusCircle, Edit3, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AddCarDialog from '@/components/admin/AddCarDialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminCarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ title: "Authentication Error", description: "No auth token found. Please log in.", variant: "destructive" });
        setIsLoading(false);
        // router.push('/login'); // Optional: redirect to login
        return;
      }
      const response = await fetch('/api/admin/cars', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch cars and parse error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCars(data);
    } catch (error: any) {
      toast({ title: "Error fetching cars", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditCar = (carId: string) => {
    console.log("Edit car:", carId);
    // TODO: Navigate to edit car page or open modal
    toast({ title: "Edit (Demo)", description: `Would edit car ${carId}. Feature not implemented.`});
  };

  const handleDeleteCar = (carId: string) => {
    console.log("Delete car:", carId);
    // TODO: Implement actual delete API call with confirmation
    toast({ title: "Delete (Demo)", description: `Would delete car ${carId}. Actual API call needed.`});
    // setCars(prevCars => prevCars.filter(car => car.id !== carId));
  };

  return (
    <div>
      <AdminPageHeader title="Manage Cars" description="Add, edit, or remove car listings.">
        <AddCarDialog onCarAdded={fetchCars}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Car
          </Button>
        </AddCarDialog>
      </AdminPageHeader>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : cars.length === 0 ? (
             <p className="text-center text-muted-foreground py-8">No cars found. Add a new car to get started.</p>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead>Price/Day</TableHead>
                <TableHead className="hidden lg:table-cell">Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image 
                      src={car.imageUrl} 
                      alt={car.name} 
                      width={60} 
                      height={40} 
                      className="rounded object-cover aspect-[3/2]"
                      data-ai-hint={car.aiHint || 'car'}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{car.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{car.type}</TableCell>
                  <TableCell>${car.pricePerDay.toFixed(2)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{car.seats}</TableCell>
                  <TableCell><Badge variant="secondary">{/* TODO: Dynamic Status */}Active</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                          <span className="sr-only">Car Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCar(car.id)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteCar(car.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
