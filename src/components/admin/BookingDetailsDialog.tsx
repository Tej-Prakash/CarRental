
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Booking } from '@/types';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { CalendarDays, CarIcon, UserCircle, Tag, Info, DollarSign, Clock, ShoppingBag, RefreshCcw } from "lucide-react";

interface BookingDetailsDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BookingDetailsDialog({ booking, isOpen, onOpenChange }: BookingDetailsDialogProps) {
  if (!booking) {
    return null;
  }

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

  const detailItemClass = "py-2 border-b border-border/50";
  const labelClass = "text-sm font-medium text-muted-foreground flex items-center";
  const valueClass = "text-sm text-foreground font-semibold";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center">
            <ShoppingBag className="mr-2 h-6 w-6" /> Booking Details
          </DialogTitle>
          <DialogDescription>
            Viewing details for Booking ID: {booking.id.substring(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
            <Image
              src={booking.carImageUrl || '/assets/images/default-car.png'}
              alt={booking.carName || 'Car image'}
              width={100}
              height={66}
              className="rounded object-cover aspect-[3/2] shadow-md"
              data-ai-hint="car"
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/default-car.png'; }}
            />
            <div>
              <h3 className="text-lg font-semibold text-primary flex items-center">
                <CarIcon className="mr-2 h-5 w-5 text-accent" />{booking.carName}
              </h3>
              <p className="text-xs text-muted-foreground">Car ID: {booking.carId.substring(0, 8)}...</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1">
            <div className={detailItemClass}>
              <p className={labelClass}><UserCircle className="mr-2 h-4 w-4 text-accent" />User Name</p>
              <p className={valueClass}>{booking.userName}</p>
              <p className="text-xs text-muted-foreground">User ID: {booking.userId.substring(0, 8)}...</p>
            </div>

            <div className={detailItemClass}>
              <p className={labelClass}><CalendarDays className="mr-2 h-4 w-4 text-accent" />Rental Period</p>
              <p className={valueClass}>
                From: {format(parseISO(booking.startDate), "MMM dd, yyyy, hh:mm a")}
              </p>
              <p className={valueClass}>
                To: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{format(parseISO(booking.endDate), "MMM dd, yyyy, hh:mm a")}
              </p>
            </div>

            <div className={detailItemClass}>
              <p className={labelClass}><DollarSign className="mr-2 h-4 w-4 text-accent" />Total Price</p>
              <p className={valueClass}>₹{booking.totalPrice.toFixed(2)}</p>
            </div>

            <div className={detailItemClass}>
              <p className={labelClass}><Info className="mr-2 h-4 w-4 text-accent" />Booking Status</p>
              <Badge variant={getStatusVariant(booking.status)} className="mt-1">{booking.status}</Badge>
            </div>

            {booking.razorpayOrderId && (
              <div className={detailItemClass}>
                <p className={labelClass}><Tag className="mr-2 h-4 w-4 text-accent" />Razorpay Order ID</p>
                <p className={valueClass + " truncate"}>{booking.razorpayOrderId}</p>
              </div>
            )}
            {booking.razorpayPaymentId && (
              <div className={detailItemClass}>
                <p className={labelClass}><Tag className="mr-2 h-4 w-4 text-accent" />Razorpay Payment ID</p>
                <p className={valueClass + " truncate"}>{booking.razorpayPaymentId}</p>
              </div>
            )}

            {booking.createdAt && (
              <div className={detailItemClass}>
                <p className={labelClass}><Clock className="mr-2 h-4 w-4 text-accent" />Booked On</p>
                <p className={valueClass}>{format(parseISO(booking.createdAt), "MMM dd, yyyy, hh:mm a")}</p>
              </div>
            )}
            {booking.updatedAt && (
              <div className={detailItemClass}>
                <p className={labelClass}><RefreshCcw className="mr-2 h-4 w-4 text-accent" />Last Updated</p>
                <p className={valueClass}>{format(parseISO(booking.updatedAt), "MMM dd, yyyy, hh:mm a")}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
