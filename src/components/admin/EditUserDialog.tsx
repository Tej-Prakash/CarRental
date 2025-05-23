
"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { User, UserRole } from '@/types';
import { Loader2, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditUserDialogProps {
  user: User;
  onUserUpdated: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const availableRoles: UserRole[] = ['Customer', 'Manager', 'Admin'];

export default function EditUserDialog({ user, onUserUpdated, isOpen, onOpenChange }: EditUserDialogProps) {
  const [name, setName] = useState(user.name);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || ''); // Added phoneNumber
  const [role, setRole] = useState<UserRole>(user.role);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name);
      setPhoneNumber(user.phoneNumber || '');
      setRole(user.role);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name) {
      toast({ title: "Validation Error", description: "Name cannot be empty.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const payload: Partial<Pick<User, 'name' | 'role' | 'phoneNumber'>> = {};
    if (name !== user.name) payload.name = name;
    if (phoneNumber !== (user.phoneNumber || '')) payload.phoneNumber = phoneNumber;
    if (role !== user.role) payload.role = role;

    if (Object.keys(payload).length === 0) {
      toast({ title: "No Changes", description: "No information was changed." });
      setIsLoading(false);
      onOpenChange(false); 
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
          toast({ title: "Authentication Error", description: "Action requires login.", variant: "destructive" });
          router.push('/login'); setIsLoading(false); return;
      }
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); router.push('/login');
        } else if (response.status === 403) {
            toast({ title: "Access Denied", description: "You do not have permission to edit users.", variant: "destructive" });
        } else {
          const result = await response.json().catch(()=> ({message: 'Failed to update user'}));
          const errorMsg = result.errors ? JSON.stringify(result.errors) : result.message;
          throw new Error(errorMsg || 'Failed to update user');
        }
        setIsLoading(false);
        return;
      } else {
        toast({ title: "User Updated", description: `${name} has been successfully updated.` });
        onOpenChange(false);
        onUserUpdated();
      }
    } catch (error: any) {
      toast({ title: "Error Updating User", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
          <DialogDescription>Update user details. Email cannot be changed here.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="edit-user-name">Full Name</Label>
            <Input id="edit-user-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="edit-user-email">Email (Read-only)</Label>
            <Input id="edit-user-email" name="email" type="email" value={user.email} readOnly disabled className="bg-muted/50 cursor-not-allowed"/>
          </div>
          <div>
            <Label htmlFor="edit-user-phoneNumber">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="edit-user-phoneNumber" name="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-user-role">Role</Label>
            <Select name="role" value={role} onValueChange={(value: UserRole) => setRole(value)}>
              <SelectTrigger id="edit-user-role"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {availableRoles.map(roleOption => (
                  <SelectItem key={roleOption} value={roleOption}>{roleOption}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
