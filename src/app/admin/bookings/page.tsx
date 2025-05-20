
"use client";

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockBookings } from '@/lib/mockData';
import type { Booking } from '@/types';
import { Edit3, Trash2, MoreHorizontal, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    setBookings(mockBookings);
  }, []);

  const handleViewBooking = (bookingId: string) => {
    console.log("View booking:", bookingId);
    // TODO: Navigate to booking details page or open modal
  };
  
  const handleEditBookingStatus = (bookingId: string) => {
    console.log("Edit booking status:", bookingId);
    // TODO: Open modal to change status
  };

  const handleDeleteBooking = (bookingId: string) => {
    console.log("Delete/Cancel booking:", bookingId);
    // TODO: Show confirmation and delete/cancel
    setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId)); // Mock delete
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead className="hidden sm:table-cell">Car</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Dates</TableHead>
                <TableHead className="hidden lg:table-cell">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.id}</TableCell>
                  <TableCell className="hidden sm:table-cell">{booking.carName || booking.carId}</TableCell>
                  <TableCell>{booking.userName || booking.userId}</TableCell>
                  <TableCell className="hidden md:table-cell">
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
          {bookings.length === 0 && <p className="text-center text-muted-foreground py-8">No bookings found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
