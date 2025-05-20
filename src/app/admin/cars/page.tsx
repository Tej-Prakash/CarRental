
"use client";

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockCars } from '@/lib/mockData';
import type { Car } from '@/types';
import Image from 'next/image';
import { PlusCircle, Edit3, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminCarsPage() {
  const [cars, setCars] = useState<Car[]>([]);

  useEffect(() => {
    // In a real app, fetch this data
    setCars(mockCars);
  }, []);

  const handleAddCar = () => {
    console.log("Add new car clicked");
    // TODO: Navigate to add car page or open modal
  };

  const handleEditCar = (carId: string) => {
    console.log("Edit car:", carId);
    // TODO: Navigate to edit car page or open modal
  };

  const handleDeleteCar = (carId: string) => {
    console.log("Delete car:", carId);
    // TODO: Show confirmation and delete
    setCars(prevCars => prevCars.filter(car => car.id !== carId)); // Mock delete
  };

  return (
    <div>
      <AdminPageHeader title="Manage Cars" description="Add, edit, or remove car listings.">
        <Button onClick={handleAddCar}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Car
        </Button>
      </AdminPageHeader>
      <Card className="shadow-sm">
        <CardContent className="p-0">
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
                  <TableCell><Badge variant="secondary">Active</Badge></TableCell> {/* Mock status */}
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
          {cars.length === 0 && <p className="text-center text-muted-foreground py-8">No cars found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
