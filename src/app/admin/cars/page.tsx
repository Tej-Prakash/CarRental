
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
import EditCarDialog from '@/components/admin/EditCarDialog'; // Import EditCarDialog
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


export default function AdminCarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [carToEdit, setCarToEdit] = useState<Car | null>(null);


  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ title: "Authentication Error", description: "No auth token found. Please log in.", variant: "destructive" });
        router.push('/login');
        setIsLoading(false);
        return;
      }
      const response = await fetch('/api/admin/cars', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          router.push('/login');
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch cars and parse error' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        setIsLoading(false);
        return;
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

  const handleOpenEditDialog = (car: Car) => {
    setCarToEdit(car);
    setShowEditDialog(true);
  };

  const confirmDeleteCar = (car: Car) => {
    setCarToDelete(car);
    setShowDeleteDialog(true);
  };

  const handleDeleteCar = async () => {
    if (!carToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ title: "Authentication Error", description: "Action requires login.", variant: "destructive" });
        router.push('/login');
        setIsDeleting(false);
        setShowDeleteDialog(false);
        return;
      }
      const response = await fetch(`/api/admin/cars/${carToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          router.push('/login');
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Failed to delete car' }));
          throw new Error(errorData.message);
        }
      } else {
        toast({ title: "Car Deleted", description: `${carToDelete.name} has been successfully deleted.` });
        setCars(prevCars => prevCars.filter(car => car.id !== carToDelete.id));
      }
    } catch (error: any) {
      toast({ title: "Error Deleting Car", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setCarToDelete(null);
    }
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
                      src={(car.imageUrls && car.imageUrls.length > 0) ? car.imageUrls[0] : '/assets/images/default-car.png'}
                      alt={car.name} 
                      width={60} 
                      height={40} 
                      className="rounded object-cover aspect-[3/2]"
                      data-ai-hint={car.aiHint || 'car'}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/60x40.png?text=No+Img';}}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{car.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{car.type}</TableCell>
                  <TableCell>₹{car.pricePerDay.toFixed(2)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(car)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => confirmDeleteCar(car)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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

      {carToEdit && (
        <EditCarDialog 
          car={carToEdit} 
          onCarUpdated={() => {
            fetchCars(); // Refresh list after update
            setShowEditDialog(false); // Close dialog
          }}
          isOpen={showEditDialog}
          onOpenChange={setShowEditDialog}
        >
          {/* This children prop for EditCarDialog is not strictly needed if trigger is handled by DropdownMenuItem */}
          <></> 
        </EditCarDialog>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this car?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the car
              "{carToDelete?.name}" from the database.
              It will not delete image files from `public/assets/images/` if they exist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setShowDeleteDialog(false); setCarToDelete(null);}} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCar} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
