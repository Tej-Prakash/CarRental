
"use client";

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User } from '@/types';
import { PlusCircle, Edit3, Trash2, MoreHorizontal, UserCircle2, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import AddUserDialog from '@/components/admin/AddUserDialog';
import EditUserDialog from '@/components/admin/EditUserDialog'; // Import EditUserDialog
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Placeholder for delete functionality as it's not fully implemented yet.
  // const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // const [userToDelete, setUserToDelete] = useState<User | null>(null);
  // const [isDeleting, setIsDeleting] = useState(false);


  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
       if (!token) {
        toast({ title: "Authentication Error", description: "No auth token found. Please log in.", variant: "destructive" });
        router.push('/login');
        setIsLoading(false);
        return;
      }
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          router.push('/login');
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users and parse error' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      toast({ title: "Error fetching users", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenEditDialog = (user: User) => {
    setUserToEdit(user);
    setShowEditDialog(true);
  };

  const handleDeleteUser = (userId: string) => {
    console.log("Delete user:", userId);
    // TODO: Implement actual delete API call with confirmation
    toast({ title: "Delete (Demo)", description: `Would delete user ${userId}. Actual API call for user deletion not yet implemented. Generally, users are disabled, not hard-deleted.`, variant:"default" });
    // setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  };

  return (
    <div>
      <AdminPageHeader title="Manage Users" description="View, edit, or add system users.">
        <AddUserDialog onUserAdded={fetchUsers}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
          </Button>
        </AddUserDialog>
      </AdminPageHeader>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found. Add a new user to get started.</p>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] hidden sm:table-cell">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Avatar className="h-9 w-9">
                      {/* <AvatarImage src="/path-to-user-avatar.png" alt={user.name} /> */}
                      <AvatarFallback>
                        <UserCircle2 className="h-5 w-5 text-muted-foreground"/>
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                          <span className="sr-only">User Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete (Demo)
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

      {userToEdit && (
        <EditUserDialog
          user={userToEdit}
          onUserUpdated={() => {
            fetchUsers(); // Refresh list
            setShowEditDialog(false); // Close dialog
          }}
          isOpen={showEditDialog}
          onOpenChange={setShowEditDialog}
        >
          <></> 
        </EditUserDialog>
      )}

      {/* AlertDialog for delete confirmation would go here if fully implemented */}

    </div>
  );
}
