
"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { format, parseISO } from 'date-fns';
import BookingDetailsDialog from '@/components/admin/BookingDetailsDialog'; 
import PaginationControls from '@/components/PaginationControls';

const ITEMS_PER_PAGE = 10;

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    description: string;
    bookingId: string | null;
    action: 'approve' | 'reject' | 'delete';
    newStatus?: Booking['status'];
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [showBookingDetailsDialog, setShowBookingDetailsDialog] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchBookings = useCallback(async (page = 1) => {
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
      const response = await fetch(`/api/admin/bookings?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          router.push('/login');
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch bookings and parse error' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        setBookings([]);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }
      const data = await response.json();
      setBookings(data.data);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (error: any) {
      toast({ title: "Error fetching bookings", description: error.message, variant: "destructive" });
      setBookings([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchBookings(currentPage);
  }, [fetchBookings, currentPage]);

  const handleViewBooking = (booking: Booking) => {
    setSelectedBookingForDetails(booking);
    setShowBookingDetailsDialog(true);
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
    if (!token) {
        toast({ title: "Authentication Error", description: "Action requires login.", variant: "destructive" });
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        router.push('/login');
        setIsProcessingAction(false);
        setShowConfirmDialog(false);
        return;
    }

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
        
        if (!response.ok) {
          if (response.status === 401) {
            toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            router.push('/login');
          } else {
            const result = await response.json().catch(()=> ({message: `Failed to ${action} cancellation`}));
            throw new Error(result.message || `Failed to ${action} cancellation`);
          }
        } else {
            toast({ title: `Cancellation ${action === 'approve' ? 'Approved' : 'Rejected'}`, description: `Booking ${bookingId.substring(0,8)} status updated to ${newStatus}.` });
        }
      
      } else if (action === 'delete') {
        toast({ title: "Delete (Demo)", description: `Would delete booking ${bookingId}. API not implemented.`, variant: "destructive" });
      }
      fetchBookings(currentPage); 
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
      case 'Completed': return 'outline'; 
      case 'Cancelled': return 'destructive';
      case 'Cancellation Requested': return 'secondary';
      case 'Cancellation Rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <AdminPageHeader title="Manage Bookings" description="Oversee and manage all car rental bookings." />
      
      {/* TODO: Add Search and Filter controls here if needed in future */}

      <Card className="shadow-sm">
        <CardContent className="p-0">
           {isLoading && bookings.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !isLoading && bookings.length === 0 ? (
             <p className="text-center text-muted-foreground py-8">No bookings found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">Car Image</TableHead>
                  <TableHead>Booking ID</TableHead>
                  <TableHead className="hidden md:table-cell">Car</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Dates & Times</TableHead>
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
                        src={booking.carImageUrl || '/assets/images/default-car.png'} 
                        alt={booking.carName || 'Car image'}
                        width={60} 
                        height={40} 
                        className="rounded object-cover aspect-[3/2]"
                        data-ai-hint="car"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/default-car.png';}}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{booking.id.substring(0,8)}...</TableCell>
                    <TableCell className="hidden md:table-cell">{booking.carName}</TableCell>
                    <TableCell>{booking.userName}</TableCell>
                    <TableCell className="text-xs">
                      {format(parseISO(booking.startDate), "MMM dd, yy, hh:mm a")} - <br/>{format(parseISO(booking.endDate), "MMM dd, yy, hh:mm a")}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">₹{booking.totalPrice.toFixed(2)}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
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
                                <Trash2 className="mr-2 h-4 w-4" /> Delete/Cancel Booking (Demo)
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

      {!isLoading && bookings.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={fetchBookings}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      <BookingDetailsDialog 
        booking={selectedBookingForDetails}
        isOpen={showBookingDetailsDialog}
        onOpenChange={(open) => {
            setShowBookingDetailsDialog(open);
            if (!open) {
                setSelectedBookingForDetails(null);
            }
        }}
      />

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
