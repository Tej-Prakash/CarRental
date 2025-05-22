
"use client";

import { useState, useEffect, useCallback } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User, UserRole } from '@/types';
import { PlusCircle, Edit3, Trash2, MoreHorizontal, UserCircle2, Loader2, FileCheck2, Eye } from 'lucide-react'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, type BadgeProps } from '@/components/ui/badge'; 
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import AddUserDialog from '@/components/admin/AddUserDialog';
import EditUserDialog from '@/components/admin/EditUserDialog';
import AdminUserDocumentsDialog from '@/components/admin/AdminUserDocumentsDialog';
import ViewUserDialog from '@/components/admin/ViewUserDialog'; 
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import PaginationControls from '@/components/PaginationControls';

const ITEMS_PER_PAGE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [userForDocuments, setUserForDocuments] = useState<User | null>(null);

  const [showViewUserDialog, setShowViewUserDialog] = useState(false);
  const [userToView, setUserToView] = useState<User | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem('authUser');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setCurrentUserRole(user.role as UserRole);
      } catch (e) {
        console.error("Failed to parse authUser in AdminUsersPage", e);
      }
    }
  }, []);

  const fetchUsers = useCallback(async (page = 1) => {
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
      const response = await fetch(`/api/admin/users?${queryParams.toString()}`, {
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
        setUsers([]);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }
      const data = await response.json();
      setUsers(data.data);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (error: any) {
      toast({ title: "Error fetching users", description: error.message, variant: "destructive" });
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  const handleOpenEditDialog = (user: User) => {
    setUserToEdit(user);
    setShowEditDialog(true);
  };
  
  const handleOpenDocumentsDialog = (user: User) => {
    setUserForDocuments(user);
    setShowDocumentsDialog(true);
  };

  const handleOpenViewUserDialog = (user: User) => {
    setUserToView(user);
    setShowViewUserDialog(true);
  };

  const handleUserDocumentsUpdated = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    setUserForDocuments(updatedUser); 
    // Optionally refetch current page to get any sorting/status changes reflected broadly
    // fetchUsers(currentPage); 
  };

  const handleDeleteUser = (userId: string) => {
    console.log("Delete user:", userId);
    toast({ title: "Delete (Demo)", description: `Would delete user ${userId}. Actual API call for user deletion not yet implemented. Generally, users are disabled, not hard-deleted.`, variant:"default" });
  };

  const getDocumentOverallStatus = (user: User): { text: string; variant: BadgeProps['variant'] } => {
    if (!user.documents || user.documents.length === 0) {
      return { text: 'No Docs', variant: 'outline' };
    }
    const hasPending = user.documents.some(doc => doc.status === 'Pending');
    const hasRejected = user.documents.some(doc => doc.status === 'Rejected');
    const allApproved = user.documents.every(doc => doc.status === 'Approved');

    if (user.documents.length < 2 && (user.documents.length > 0 && !allApproved)) { // Less than 2 docs and not all are approved
        if (hasPending) return { text: 'Pending Review', variant: 'secondary' };
        if (hasRejected) return { text: 'Rejected Docs', variant: 'destructive' };
        return { text: 'Incomplete', variant: 'outline' }; // Some uploaded, but not all 2, and not all approved
    }
    if (user.documents.length === 2) { // Both docs exist
        if (allApproved) return { text: 'Verified', variant: 'default' };
        if (hasPending) return { text: 'Pending Review', variant: 'secondary' };
        if (hasRejected) return { text: 'Rejected Docs', variant: 'destructive' };
    }
    // Fallback for other states
    return { text: 'Needs Action', variant: 'outline' }; 
  };

  const isCurrentUserAdmin = currentUserRole === 'Admin';

  return (
    <div>
      <AdminPageHeader title="Manage Users" description="View, edit, or add system users.">
        {isCurrentUserAdmin && (
          <AddUserDialog onUserAdded={() => fetchUsers(1)}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New User
            </Button>
          </AddUserDialog>
        )}
      </AdminPageHeader>
      
      {/* TODO: Add Search and Filter controls here if needed in future */}

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading && users.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !isLoading && users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found. Add a new user to get started.</p>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] hidden sm:table-cell">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Doc Status</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const docStatus = getDocumentOverallStatus(user);
                return (
                <TableRow key={user.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        <UserCircle2 className="h-5 w-5 text-muted-foreground"/>
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={user.role === 'Admin' ? 'default' : (user.role === 'Manager' ? 'outline' : 'secondary')}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={docStatus.variant} className="text-xs">{docStatus.text}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                          <span className="sr-only">User Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenViewUserDialog(user)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {isCurrentUserAdmin && (
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleOpenDocumentsDialog(user)}>
                          <FileCheck2 className="mr-2 h-4 w-4" /> Manage Documents
                        </DropdownMenuItem>
                        {isCurrentUserAdmin && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete (Demo)
                                </DropdownMenuItem>
                            </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && users.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={fetchUsers}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {userToEdit && isCurrentUserAdmin && (
        <EditUserDialog
          user={userToEdit}
          onUserUpdated={() => {
            fetchUsers(currentPage); 
            setShowEditDialog(false); 
            setUserToEdit(null); 
          }}
          isOpen={showEditDialog}
          onOpenChange={(open) => {
             setShowEditDialog(open);
             if (!open) setUserToEdit(null);
          }}
        />
      )}

      {userForDocuments && (
        <AdminUserDocumentsDialog
            user={userForDocuments}
            isOpen={showDocumentsDialog}
            onOpenChange={(open) => {
                setShowDocumentsDialog(open);
                if (!open) setUserForDocuments(null);
            }}
            onDocumentsUpdated={handleUserDocumentsUpdated}
        />
      )}

      {userToView && (
        <ViewUserDialog
          user={userToView}
          isOpen={showViewUserDialog}
          onOpenChange={(open) => {
            setShowViewUserDialog(open);
            if (!open) setUserToView(null);
          }}
        />
      )}

    </div>
  );
}
