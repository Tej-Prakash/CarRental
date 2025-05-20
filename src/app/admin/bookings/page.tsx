
"use client";

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Booking } from '@/types';
import { Edit3, Trash2, MoreHorizontal, Eye, Loader2, CheckCircle, XCircle } from 'lucide-react';
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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    description: string;
    bookingId: string | null;
    action: 'approve' | 'reject' | 'delete';
    newStatus?: Booking['status'];
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);


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
    toast({title: "View Details (Demo)", description: `Viewing details for booking ${bookingId}. Not implemented.`});
  };
  
  const confirmAction = (booking: Booking, action: 'approve' | 'reject' | 'delete') => {
    let title = '';
    let description = '';
    let newStatus: Booking['status'] | undefined = undefined;

    if (action === 'approve') {
      title = 'Approve Cancellation Request?';
      description = `Are you sure you want to approve the cancellation for booking ID ${booking.id.substring(0,8)}...? This will change status to 'Cancelled' and simulate a refund.`;
      newStatus = 'Cancelled';
    } else if (action === 'reject') {
      title = 'Reject Cancellation Request?';
      description = `Are you sure you want to reject the cancellation for booking ID ${booking.id.substring(0,8)}...? This will revert status to 'Confirmed'.`;
      newStatus = 'Confirmed';
    } else if (action === 'delete') {
      title = 'Delete Booking?';
      description = `Are you sure you want to delete booking ID ${booking.id.substring(0,8)}...? This action cannot be undone. (Note: Backend for delete not yet implemented).`;
    }
    
    setDialogConfig({ title, description, bookingId: booking.id, action, newStatus });
    setShowConfirmDialog(true);
  };

  const processBookingAction = async () => {
    if (!dialogConfig || !dialogConfig.bookingId) return;
    setIsProcessingAction(true);

    const { bookingId, action, newStatus } = dialogConfig;
    const token = localStorage.getItem('authToken');

    try {
      if (action === 'approve' || action === 'reject') {
        if (!newStatus) throw new Error("New status not defined for action.");
        const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ status: newStatus }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `Failed to ${action} cancellation`);
        toast({ title: `Cancellation ${action === 'approve' ? 'Approved' : 'Rejected'}`, description: `Booking ${bookingId.substring(0,8)} status updated to ${newStatus}.` });
      
      } else if (action === 'delete') {
        // TODO: Implement actual DELETE API call
        // For now, just show a toast and filter locally (if desired, but re-fetch is better)
        toast({ title: "Delete (Demo)", description: `Would delete booking ${bookingId}. API not implemented.`, variant: "destructive" });
      }
      fetchBookings(); // Refresh the list
    } catch (error: any) {
      toast({ title: `Error ${action} booking`, description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
      setShowConfirmDialog(false);
      setDialogConfig(null);
    }
  };


  const getStatusVariant = (status: Booking['status']): BadgeProps["variant"] => {
    switch (status) {
      case 'Confirmed': return 'default'; 
      case 'Pending': return 'secondary';
      case 'Completed': return 'outline'; // Consider a success-like variant if Shadcn has one
      case 'Cancelled': return 'destructive';
      case 'Cancellation Requested': return 'secondary'; // Could be 'warning' if you add custom variants
      case 'Cancellation Rejected': return 'destructive';
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
                          
                          {booking.status === 'Cancellation Requested' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => confirmAction(booking, 'approve')} className="text-green-600 focus:text-green-700 focus:bg-green-100">
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve Cancellation
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => confirmAction(booking, 'reject')} className="text-orange-600 focus:text-orange-700 focus:bg-orange-100">
                                <XCircle className="mr-2 h-4 w-4" /> Reject Cancellation
                              </DropdownMenuItem>
                            </>
                          )}

                          {booking.status !== 'Cancelled' && booking.status !== 'Completed' && booking.status !== 'Cancellation Requested' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => confirmAction(booking, 'delete')} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete/Cancel Booking
                              </DropdownMenuItem>
                            </>
                          )}
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

      {dialogConfig && (
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogConfig.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {dialogConfig.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {setShowConfirmDialog(false); setDialogConfig(null);}} disabled={isProcessingAction}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={processBookingAction} 
                disabled={isProcessingAction} 
                className={dialogConfig.action === 'approve' ? "bg-green-600 hover:bg-green-700 text-white" : (dialogConfig.action === 'reject' ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground")}
              >
                {isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {dialogConfig.action === 'approve' ? 'Approve' : dialogConfig.action === 'reject' ? 'Reject' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}

