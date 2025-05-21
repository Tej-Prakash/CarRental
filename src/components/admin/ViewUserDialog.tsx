
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
import type { User, UserDocument, DocumentStatus } from '@/types';
import { format, parseISO } from 'date-fns';
import { UserCircle, Mail, Shield, CalendarDays, MapPin, Home, FileText, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface ViewUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewUserDialog({ user, isOpen, onOpenChange }: ViewUserDialogProps) {
  if (!user) {
    return null;
  }

  const getRoleVariant = (role: User['role']): BadgeProps["variant"] => {
    return role === 'Admin' ? 'default' : 'secondary';
  };

  const getDocumentStatusVariant = (status?: DocumentStatus): BadgeProps["variant"] => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getDocumentStatusIcon = (status?: DocumentStatus) => {
    switch(status) {
      case 'Approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'Pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />; 
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
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
            <UserCircle className="mr-2 h-6 w-6" /> User Details
          </DialogTitle>
          <DialogDescription>
            Viewing details for {user.name} (ID: {user.id.substring(0, 8)}...)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className={detailItemClass}>
            <p className={labelClass}><UserCircle className="mr-2 h-4 w-4 text-accent" />Name</p>
            <p className={valueClass}>{user.name}</p>
          </div>

          <div className={detailItemClass}>
            <p className={labelClass}><Mail className="mr-2 h-4 w-4 text-accent" />Email</p>
            <p className={valueClass}>{user.email}</p>
          </div>

          <div className={detailItemClass}>
            <p className={labelClass}><Shield className="mr-2 h-4 w-4 text-accent" />Role</p>
            <Badge variant={getRoleVariant(user.role)} className="mt-1">{user.role}</Badge>
          </div>
          
          {user.address && (user.address.street || user.address.city) && (
            <div className={detailItemClass}>
              <p className={labelClass}><Home className="mr-2 h-4 w-4 text-accent" />Address</p>
              <p className={valueClass}>
                {user.address.street}, {user.address.city}, {user.address.state} {user.address.zip}, {user.address.country}
              </p>
            </div>
          )}

          {user.location && (
             <div className={detailItemClass}>
              <p className={labelClass}><MapPin className="mr-2 h-4 w-4 text-accent" />Location / Preferred Pickup</p>
              <p className={valueClass}>{user.location}</p>
            </div>
          )}

          <div className={detailItemClass}>
            <p className={labelClass}><CalendarDays className="mr-2 h-4 w-4 text-accent" />Joined On</p>
            <p className={valueClass}>{format(parseISO(user.createdAt), "MMM dd, yyyy, hh:mm a")}</p>
          </div>

          {user.updatedAt && (
            <div className={detailItemClass}>
              <p className={labelClass}><CalendarDays className="mr-2 h-4 w-4 text-accent" />Last Updated</p>
              <p className={valueClass}>{format(parseISO(user.updatedAt), "MMM dd, yyyy, hh:mm a")}</p>
            </div>
          )}

          <div className="pt-2">
            <p className={labelClass}><FileText className="mr-2 h-4 w-4 text-accent" />Verification Documents</p>
            {user.documents && user.documents.length > 0 ? (
              <ul className="space-y-2 mt-1">
                {user.documents.map((doc: UserDocument) => (
                  <li key={doc.type} className="p-2 border rounded-md bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{doc.type}: <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{doc.fileName}</a></span>
                       <Badge variant={getDocumentStatusVariant(doc.status)} className="flex items-center gap-1">
                        {getDocumentStatusIcon(doc.status)}
                        {doc.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Uploaded: {format(parseISO(doc.uploadedAt), "PPp")}</p>
                    {doc.verifiedAt && <p className="text-xs text-muted-foreground">Reviewed: {format(parseISO(doc.verifiedAt), "PPp")}</p>}
                    {doc.adminComments && <p className="text-xs text-muted-foreground mt-1">Comment: {doc.adminComments}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">No documents uploaded.</p>
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
