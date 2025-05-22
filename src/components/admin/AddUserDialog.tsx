
"use client";

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
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddUserDialogProps {
  onUserAdded: () => void;
  children: React.ReactNode;
}

const initialUserState: Omit<User, 'id' | 'createdAt' | 'role'> & { password?: string; role: UserRole } = {
  name: '',
  email: '',
  password: '',
  role: 'Customer', 
};

const availableRoles: UserRole[] = ['Customer', 'Manager', 'Admin'];

export default function AddUserDialog({ onUserAdded, children }: AddUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState(initialUserState);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: UserRole) => {
    setUserData(prev => ({ ...prev, role: value }));
  };

  const resetForm = () => {
    setUserData(initialUserState);
    setShowPassword(false);
  }

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!userData.name || !userData.email || !userData.password || userData.password.length < 6) {
      toast({ title: "Validation Error", description: "Please fill all fields correctly. Password must be at least 6 characters.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
          toast({ title: "Authentication Error", description: "Action requires login.", variant: "destructive" });
          router.push('/login');
          setIsLoading(false);
          return;
      }
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          router.push('/login');
        } else if (response.status === 403) {
            toast({ title: "Access Denied", description: "You do not have permission to add users.", variant: "destructive" });
        } else {
          const result = await response.json().catch(()=> ({message: 'Failed to add user'}));
          const errorMsg = result.errors ? JSON.stringify(result.errors) : result.message;
          throw new Error(errorMsg || 'Failed to add user');
        }
        setIsLoading(false);
        return;
      }
      const result = await response.json();
      toast({ title: "User Added", description: `${result.name} has been successfully added.` });
      setIsOpen(false);
      onUserAdded();
    } catch (error: any) {
      toast({ title: "Error Adding User", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account for the system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div><Label htmlFor="add-user-name">Full Name</Label><Input id="add-user-name" name="name" value={userData.name} onChange={handleChange} required /></div>
          <div><Label htmlFor="add-user-email">Email</Label><Input id="add-user-email" name="email" type="email" value={userData.email} onChange={handleChange} required /></div>
          <div>
            <Label htmlFor="add-user-password">Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                id="add-user-password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
                value={userData.password || ''} 
                onChange={handleChange} 
                required 
                className="pl-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <div><Label htmlFor="add-user-role">Role</Label>
            <Select name="role" value={userData.role} onValueChange={handleSelectChange}>
              <SelectTrigger id="add-user-role"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
