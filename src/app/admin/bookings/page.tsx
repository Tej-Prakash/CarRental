
"use client";

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Booking } from '@/types';
import { Edit3, Trash2, MoreHorizontal, Eye, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ title: "Authentication Error", description: "No auth token found. Please log in.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const response = await fetch('/api/admin/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch bookings and parse error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: Booking[] = await response.json();
      setBookings(data);
    } catch (error: any) {
      toast({ title: "Error fetching bookings", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewBooking = (bookingId: string) => {
    console.log("View booking:", bookingId);
    toast({title: "View Details (Demo)", description: `Viewing details for booking ${bookingId}.`});
    // TODO: Navigate to booking details page or open modal
  };
  
  const handleEditBookingStatus = (bookingId: string) => {
    console.log("Edit booking status:", bookingId);
    toast({title: "Edit Status (Demo)", description: `Opening modal to edit status for ${bookingId}.`});
    // TODO: Open modal to change status
  };

  const handleDeleteBooking = (bookingId: string) => {
    console.log("Delete/Cancel booking:", bookingId);
    toast({title: "Delete/Cancel (Demo)", description: `Would delete/cancel booking ${bookingId}. API call needed.`});
    // TODO: Show confirmation and delete/cancel API call
    // setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId)); 
  };

  const getStatusVariant = (status: Booking['status']): BadgeProps["variant"] => {
    switch (status) {
      case 'Confirmed': return 'default'; 
      case 'Pending': return 'secondary';
      case 'Completed': return 'outline'; 
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <AdminPageHeader title="Manage Bookings" description="Oversee and manage all car rental bookings." />
      <Card className="shadow-sm">
        <CardContent className="p-0">
           {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
             <p className="text-center text-muted-foreground py-8">No bookings found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">Car Image</TableHead>
                  <TableHead>Booking ID</TableHead>
                  <TableHead className="hidden md:table-cell">Car</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="hidden lg:table-cell">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image 
                        src={booking.carImageUrl || 'https://placehold.co/60x40.png'} 
                        alt={booking.carName || 'Car image'}
                        width={60} 
                        height={40} 
                        className="rounded object-cover aspect-[3/2]"
                        data-ai-hint="car"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{booking.id.substring(0,8)}...</TableCell>
                    <TableCell className="hidden md:table-cell">{booking.carName}</TableCell>
                    <TableCell>{booking.userName}</TableCell>
                    <TableCell>
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">${booking.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                            <span className="sr-only">Booking Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewBooking(booking.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditBookingStatus(booking.id)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Edit Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteBooking(booking.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Cancel/Delete
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
