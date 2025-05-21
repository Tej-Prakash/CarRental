
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
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { User, UserDocument, DocumentType, DocumentStatus } from '@/types';
import { Loader2, CheckCircle, XCircle, AlertTriangle, DownloadCloud } from 'lucide-react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface AdminUserDocumentsDialogProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentsUpdated: (updatedUser: User) => void;
}

type EditableDocumentState = {
  [key in DocumentType]?: {
    comments: string;
    isProcessing: boolean;
  }
};

export default function AdminUserDocumentsDialog({ user, isOpen, onOpenChange, onDocumentsUpdated }: AdminUserDocumentsDialogProps) {
  const [documentsState, setDocumentsState] = useState<EditableDocumentState>({});
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user && user.documents) {
      const initialDocState: EditableDocumentState = {};
      (user.documents as UserDocument[]).forEach(doc => {
        initialDocState[doc.type] = {
          comments: doc.adminComments || '',
          isProcessing: false,
        };
      });
      setDocumentsState(initialDocState);
    } else {
      setDocumentsState({});
    }
  }, [user, isOpen]);

  const handleCommentChange = (docType: DocumentType, value: string) => {
    setDocumentsState(prev => ({
      ...prev,
      [docType]: { ...prev[docType]!, comments: value }
    }));
  };

  const handleUpdateStatus = async (docType: DocumentType, newStatus: 'Approved' | 'Rejected') => {
    if (!user) return;

    setDocumentsState(prev => ({
      ...prev,
      [docType]: { ...prev[docType]!, isProcessing: true }
    }));

    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Error", description: "Action requires login.", variant: "destructive" });
      router.push('/login');
      setDocumentsState(prev => ({ ...prev, [docType]: { ...prev[docType]!, isProcessing: false } }));
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}/documents/${docType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminComments: documentsState[docType]?.comments || '',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); router.push('/login');
        } else {
          throw new Error(result.message || `Failed to update ${docType} status.`);
        }
      } else {
        toast({ title: "Document Status Updated", description: `${docType} has been ${newStatus.toLowerCase()}.` });
        onDocumentsUpdated(result as User); // result should be the updated user object
         // Update local state for the dialog immediately
        setDocumentsState(prev => ({
          ...prev,
          [docType]: { comments: result.documents?.find((d: UserDocument) => d.type === docType)?.adminComments || '', isProcessing: false }
        }));
      }
    } catch (error: any) {
      toast({ title: `Error Updating ${docType}`, description: error.message, variant: "destructive" });
    } finally {
      setDocumentsState(prev => ({
        ...prev,
        [docType]: { ...prev[docType]!, isProcessing: false }
      }));
    }
  };
  
  const getStatusVariant = (status?: DocumentStatus): BadgeProps["variant"] => {
    switch (status) {
      case 'Approved': return 'default'; // green-ish or primary
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getDocument = (docType: DocumentType): UserDocument | undefined => {
    return user?.documents?.find(doc => doc.type === docType);
  };


  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
           <DialogHeader><DialogTitle>Error</DialogTitle></DialogHeader>
           <p>No user data provided to manage documents.</p>
           <DialogFooter><Button onClick={()=>onOpenChange(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const documentTypes: DocumentType[] = ['PhotoID', 'DrivingLicense'];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Manage Documents for {user.name}</DialogTitle>
          <DialogDescription>Review and approve/reject user's verification documents.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {documentTypes.map(docType => {
            const doc = getDocument(docType);
            const docState = documentsState[docType];

            if (!doc) {
              return (
                <div key={docType} className="p-4 border rounded-md bg-muted/50">
                  <h3 className="font-semibold text-lg mb-2">{docType}</h3>
                  <p className="text-sm text-muted-foreground">Not uploaded by user.</p>
                </div>
              );
            }

            return (
              <div key={doc.type} className="p-4 border rounded-md shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{doc.type}</h3>
                  <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  File: <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{doc.fileName}</a>
                </p>
                <p className="text-xs text-muted-foreground">Uploaded: {new Date(doc.uploadedAt).toLocaleString()}</p>
                {doc.verifiedAt && <p className="text-xs text-muted-foreground">Reviewed: {new Date(doc.verifiedAt).toLocaleString()}</p>}
                
                <div className="mt-3">
                  <Label htmlFor={`${doc.type}-comments`}>Admin Comments</Label>
                  <Textarea
                    id={`${doc.type}-comments`}
                    value={docState?.comments || ''}
                    onChange={(e) => handleCommentChange(doc.type, e.target.value)}
                    placeholder="Leave comments for the user (optional for approval, recommended for rejection)"
                    className="mt-1"
                    rows={2}
                    disabled={docState?.isProcessing}
                  />
                </div>

                <div className="flex gap-2 mt-3 justify-end">
                  {doc.status !== 'Approved' && (
                    <Button 
                      onClick={() => handleUpdateStatus(doc.type, 'Approved')} 
                      disabled={docState?.isProcessing}
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {docState?.isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Approve
                    </Button>
                  )}
                  {doc.status !== 'Rejected' && (
                    <Button 
                      onClick={() => handleUpdateStatus(doc.type, 'Rejected')} 
                      disabled={docState?.isProcessing}
                      variant="destructive"
                      size="sm"
                    >
                      {docState?.isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                      Reject
                    </Button>
                  )}
                </div>
                {doc.status === 'Approved' && <p className="text-sm text-green-600 mt-2">This document is approved.</p>}
                {doc.status === 'Rejected' && <p className="text-sm text-destructive mt-2">This document is rejected.</p>}
              </div>
            );
          })}
           {user.documents?.length === 0 && <p className="text-muted-foreground text-center py-4">No documents uploaded by this user yet.</p>}
        </div>

        <DialogFooter className="pt-4">
          <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
