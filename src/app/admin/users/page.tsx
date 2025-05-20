
"use client";

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockUsers } from '@/lib/mockData';
import type { User } from '@/types';
import { PlusCircle, Edit3, Trash2, MoreHorizontal, UserCircle2 } from 'lucide-react';
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const handleAddUser = () => {
    console.log("Add new user clicked");
    // TODO: Navigate to add user page or open modal
  };

  const handleEditUser = (userId: string) => {
    console.log("Edit user:", userId);
    // TODO: Navigate to edit user page or open modal
  };

  const handleDeleteUser = (userId: string) => {
    console.log("Delete user:", userId);
    // TODO: Show confirmation and delete
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId)); // Mock delete
  };

  return (
    <div>
      <AdminPageHeader title="Manage Users" description="View, edit, or add system users.">
        <Button onClick={handleAddUser}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </AdminPageHeader>
      <Card className="shadow-sm">
        <CardContent className="p-0">
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
                        <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length === 0 && <p className="text-center text-muted-foreground py-8">No users found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
