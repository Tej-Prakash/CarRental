
"use client";

import { useState, useEffect, useCallback } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Car } from '@/types';
import Image from 'next/image';
import { PlusCircle, Edit3, Trash2, MoreHorizontal, Loader2, Search as SearchIcon, Filter as FilterIcon } from 'lucide-react';
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
import EditCarDialog from '@/components/admin/EditCarDialog';
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
} from "@/components/ui/alert-dialog";
import PaginationControls from '@/components/PaginationControls';
import { Label } from '@/components/ui/label';

const ITEMS_PER_PAGE = 10;

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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [carTypeFilter, setCarTypeFilter] = useState('all');
  const [appliedCarTypeFilter, setAppliedCarTypeFilter] = useState('all');

  const [allCarTypesForFilter, setAllCarTypesForFilter] = useState<string[]>(['all']);

  const fetchCarTypesForFilter = useCallback(async () => {
    // This endpoint fetches all cars, which might be inefficient for just types
    // In a real app, consider a dedicated endpoint for car types
    try {
      const token = localStorage.getItem('authToken');
      // No token check here as it's for filter population, main data fetch will check token.
      const response = await fetch('/api/admin/cars?limit=1000', { // Fetch a large number to get all types
         headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const result = await response.json();
        const types = Array.from(new Set(result.data.map((car: Car) => car.type))) as string[];
        setAllCarTypesForFilter(['all', ...types]);
      }
    } catch (error) {
      console.error("Error fetching car types for filter:", error);
    }
  }, []);

  useEffect(() => {
    fetchCarTypesForFilter();
  }, [fetchCarTypesForFilter]);


  const fetchCars = useCallback(async (page = 1, search = appliedSearchTerm, type = appliedCarTypeFilter) => {
    setIsLoading(true);
    setCurrentPage(page);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ title: "Authentication Error", description: "No auth token found. Please log in.", variant: "destructive" });
        router.push('/login');
        setIsLoading(false);
        return;
      }
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });
      if (search) queryParams.append('search', search);
      if (type && type !== 'all') queryParams.append('type', type);

      const response = await fetch(`/api/admin/cars?${queryParams.toString()}`, {
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
        setCars([]);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }
      const data = await response.json();
      setCars(data.data);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (error: any) {
      toast({ title: "Error fetching cars", description: error.message, variant: "destructive" });
      setCars([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [router, toast, appliedSearchTerm, appliedCarTypeFilter]);

  useEffect(() => {
    fetchCars(currentPage, appliedSearchTerm, appliedCarTypeFilter);
  }, [fetchCars, currentPage, appliedSearchTerm, appliedCarTypeFilter]);

  const handleSearchAndFilter = () => {
    setAppliedSearchTerm(searchTerm);
    setAppliedCarTypeFilter(carTypeFilter);
    setCurrentPage(1); // Reset to first page on new search/filter
    // fetchCars(1, searchTerm, carTypeFilter); // This will be triggered by useEffect on appliedSearchTerm/appliedCarTypeFilter change
  };

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
        // Refetch current page or adjust if last item on page deleted
        fetchCars(currentPage, appliedSearchTerm, appliedCarTypeFilter);
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
        <AddCarDialog onCarAdded={() => fetchCars(1, appliedSearchTerm, appliedCarTypeFilter)}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Car
          </Button>
        </AddCarDialog>
      </AdminPageHeader>

      <Card className="mb-6 shadow-sm">
        <CardContent className="p-4 space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
          <div className="flex-grow">
            <Label htmlFor="searchTermCars">Search by Name</Label>
            <Input
              id="searchTermCars"
              placeholder="Enter car name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex-grow">
            <Label htmlFor="carTypeFilterCars">Filter by Type</Label>
            <Select value={carTypeFilter} onValueChange={setCarTypeFilter}>
              <SelectTrigger id="carTypeFilterCars" className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {allCarTypesForFilter.map(type => (
                  <SelectItem key={type} value={type}>{type === 'all' ? 'All Types' : type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearchAndFilter} className="w-full md:w-auto">
            <SearchIcon className="mr-2 h-4 w-4" /> Search / Filter
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading && cars.length === 0 ? ( // Show loader only if no cars are displayed yet
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !isLoading && cars.length === 0 ? (
             <p className="text-center text-muted-foreground py-8">No cars found matching your criteria. Add a new car or adjust filters.</p>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead>Price/Hour</TableHead> 
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
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/default-car.png';}}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{car.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{car.type}</TableCell>
                  <TableCell>₹{typeof car.pricePerHour === 'number' ? car.pricePerHour.toFixed(2) : 'N/A'}</TableCell>
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

      {!isLoading && cars.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => fetchCars(page, appliedSearchTerm, appliedCarTypeFilter)}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {carToEdit && (
        <EditCarDialog 
          car={carToEdit} 
          onCarUpdated={() => {
            fetchCars(currentPage, appliedSearchTerm, appliedCarTypeFilter); 
            setShowEditDialog(false); 
            setCarToEdit(null);
          }}
          isOpen={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) setCarToEdit(null);
          }}
        />
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
