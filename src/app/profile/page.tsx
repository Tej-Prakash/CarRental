
"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { User, Address, UserDocument as UserDocumentType, DocumentStatus } from '@/types';
import { Loader2, UserCircle, Mail, Home, MapPin, UploadCloud, FileText, ShieldAlert, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image'; // For document previews
import { Badge, BadgeProps } from '@/components/ui/badge'; // For status badges
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState<Address>({ street: '', city: '', state: '', zip: '', country: '' });
  const [location, setLocation] = useState('');

  const [photoIdFile, setPhotoIdFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isUploadingPhotoId, setIsUploadingPhotoId] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

  const fetchProfile = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ title: "Unauthorized", description: "Please log in to view your profile.", variant: "destructive" });
        router.push('/login');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          if (response.status === 401) {
            toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            router.push('/login');
          } else {
            const errorData = await response.json().catch(()=>({message: 'Failed to fetch profile'}));
            throw new Error(errorData.message || 'Failed to fetch profile');
          }
          setUser(null); 
          setIsLoading(false);
          return;
        }
        const data: User = await response.json();
        setUser(data);
        setName(data.name || '');
        setAddress(data.address || { street: '', city: '', state: '', zip: '', country: '' });
        setLocation(data.location || '');
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setUser(null); 
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
        toast({ title: "Authentication Error", description: "Action requires login.", variant: "destructive" });
        router.push('/login');
        setIsUpdating(false);
        return;
    }

    const updatePayload: Partial<Pick<User, 'name' | 'address' | 'location'>> = {};
    if (name !== user?.name) updatePayload.name = name;
    if (JSON.stringify(address) !== JSON.stringify(user?.address || { street: '', city: '', state: '', zip: '', country: '' })) updatePayload.address = address;
    if (location !== user?.location) updatePayload.location = location;
    
    const addressFields = Object.values(address);
    const filledAddressFields = addressFields.filter(field => field && field.trim() !== '').length;

    if (filledAddressFields > 0 && filledAddressFields < Object.keys(address).length) {
        toast({ title: "Incomplete Address", description: "Please fill all address fields or leave them all empty.", variant: "destructive"});
        setIsUpdating(false);
        return;
    }
    if (filledAddressFields === 0 && user?.address && (user.address.street || user.address.city)) { 
        updatePayload.address = { street: '', city: '', state: '', zip: '', country: '' }; // Explicitly clear
    } else if (filledAddressFields === 0) {
        delete updatePayload.address; 
    }

    if (Object.keys(updatePayload).length === 0) {
      toast({ title: "No Changes", description: "No information was changed." });
      setIsUpdating(false);
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updatePayload),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); router.push('/login');
        } else {
            const result = await response.json().catch(()=>({message: 'Failed to update profile'}));
            throw new Error(result.message || 'Failed to update profile');
        }
        setIsUpdating(false);
        return;
      }
      const result = await response.json();
      setUser(result.user); 
      setName(result.user.name || '');
      setAddress(result.user.address || { street: '', city: '', state: '', zip: '', country: '' });
      setLocation(result.user.location || '');
      localStorage.setItem('authUser', JSON.stringify(result.user)); // Update local authUser

      toast({ title: "Profile Updated", description: "Your information has been saved." });
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDocumentUpload = async (documentType: 'PhotoID' | 'DrivingLicense', file: File | null) => {
    if (!file) {
      toast({ title: "No File Selected", description: `Please select a file for ${documentType}.`, variant: "destructive" });
      return;
    }

    if (documentType === 'PhotoID') setIsUploadingPhotoId(true);
    else setIsUploadingLicense(true);

    const token = localStorage.getItem('authToken');
    if (!token) {
        toast({ title: "Authentication Error", description: "Action requires login.", variant: "destructive" });
        router.push('/login');
        if (documentType === 'PhotoID') setIsUploadingPhotoId(false); else setIsUploadingLicense(false);
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);

    let uploadedFilePath = '';
    try {
      const uploadResponse = await fetch('/api/upload?destination=documents', {
        method: 'POST',
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.message || `Failed to upload ${documentType} file.`);
      }
      uploadedFilePath = uploadResult.filePath;
    } catch (uploadError: any) {
      toast({ title: "File Upload Failed", description: uploadError.message, variant: "destructive" });
      if (documentType === 'PhotoID') setIsUploadingPhotoId(false); else setIsUploadingLicense(false);
      return;
    }

    try {
      const recordResponse = await fetch('/api/profile/documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
            documentType, 
            fileName: file.name, 
            filePath: uploadedFilePath 
        }),
      });
      
      const result = await recordResponse.json();
      if (!recordResponse.ok) {
        if (recordResponse.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); router.push('/login');
        } else {
            throw new Error(result.message || `Failed to record ${documentType} details`);
        }
      } else {
        fetchProfile(); 
        toast({ title: `${documentType} Uploaded`, description: `${file.name} submitted for verification.` });
        if (documentType === 'PhotoID') setPhotoIdFile(null); else setLicenseFile(null);
      }
    } catch (error: any) {
      toast({ title: "Document Record Failed", description: error.message, variant: "destructive" });
    } finally {
      if (documentType === 'PhotoID') setIsUploadingPhotoId(false);
      else setIsUploadingLicense(false);
    }
  };
  
  const getStatusBadgeVariant = (status: DocumentStatus): BadgeProps["variant"] => {
    switch (status) {
      case 'Approved': return 'default'; 
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };
  
  const getStatusIcon = (status: DocumentStatus) => {
    switch(status) {
      case 'Approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'Pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />; 
      default: return null;
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Profile Error</h1>
        <p className="text-muted-foreground">Could not load your profile. Please try logging in again.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <UserCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold text-primary">My Profile</CardTitle>
              <CardDescription>View and manage your account details and documents.</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <form onSubmit={handleProfileUpdate}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="email" type="email" value={user.email} readOnly disabled className="pl-10 bg-muted/50 cursor-not-allowed" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center"><Home className="h-5 w-5 mr-2 text-primary"/> Address</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="street" value={address.street} onChange={handleAddressChange} placeholder="Street Address" />
                <Input name="city" value={address.city} onChange={handleAddressChange} placeholder="City" />
                <Input name="state" value={address.state} onChange={handleAddressChange} placeholder="State / Province" />
                <Input name="zip" value={address.zip} onChange={handleAddressChange} placeholder="ZIP / Postal Code" />
                <Input name="country" value={address.country} onChange={handleAddressChange} placeholder="Country" className="md:col-span-2"/>
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="flex items-center"><MapPin className="h-5 w-5 mr-2 text-primary"/> Current Location / Preferred Pickup Area</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Downtown Main Street" />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <UploadCloud className="h-7 w-7 mr-3 text-accent" /> Verification Documents
          </CardTitle>
          <CardDescription>
            Upload your Photo ID and Driving License for verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="photoId">Photo ID (e.g., Passport, National ID)</Label>
            <div className="flex gap-2 items-center">
              <Input id="photoId" type="file" onChange={(e) => setPhotoIdFile(e.target.files ? e.target.files[0] : null)} className="flex-grow" accept="image/*,application/pdf"/>
              <Button onClick={() => handleDocumentUpload('PhotoID', photoIdFile)} disabled={!photoIdFile || isUploadingPhotoId}>
                {isUploadingPhotoId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Upload
              </Button>
            </div>
             { user.documents?.find(doc => doc.type === 'PhotoID')?.filePath && (
                <div className="mt-2 text-xs">
                    Current Photo ID: <a href={user.documents.find(doc => doc.type === 'PhotoID')?.filePath} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{user.documents.find(doc => doc.type === 'PhotoID')?.fileName}</a>
                </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="drivingLicense">Driving License</Label>
            <div className="flex gap-2 items-center">
              <Input id="drivingLicense" type="file" onChange={(e) => setLicenseFile(e.target.files ? e.target.files[0] : null)} className="flex-grow" accept="image/*,application/pdf"/>
              <Button onClick={() => handleDocumentUpload('DrivingLicense', licenseFile)} disabled={!licenseFile || isUploadingLicense}>
                {isUploadingLicense && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Upload
              </Button>
            </div>
            { user.documents?.find(doc => doc.type === 'DrivingLicense')?.filePath && (
                <div className="mt-2 text-xs">
                    Current Driving License: <a href={user.documents.find(doc => doc.type === 'DrivingLicense')?.filePath} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{user.documents.find(doc => doc.type === 'DrivingLicense')?.fileName}</a>
                </div>
            )}
          </div>
          
          {user.documents && user.documents.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">Uploaded Documents Status:</h3>
              <ul className="space-y-3">
                {user.documents.map((doc, index) => (
                  <li key={index} className={cn("p-3 border rounded-md shadow-sm",
                    doc.status === 'Approved' ? 'border-green-500 bg-green-50' :
                    doc.status === 'Rejected' ? 'border-destructive bg-destructive/10' :
                    'border-border bg-secondary/50'
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-accent" />
                        <span className="font-medium"><strong>{doc.type}:</strong> 
                          <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">{doc.fileName}</a>
                        </span>
                      </div>
                      <Badge variant={getStatusBadgeVariant(doc.status)} className="flex items-center gap-1">
                        {getStatusIcon(doc.status)}
                        {doc.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Uploaded: {new Date(doc.uploadedAt).toLocaleString()}</p>
                    {doc.verifiedAt && <p className="text-xs text-muted-foreground">Reviewed: {new Date(doc.verifiedAt).toLocaleString()}</p>}
                    {doc.adminComments && (
                      <p className={cn("text-sm mt-2 p-2 rounded-md", 
                        doc.status === 'Rejected' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                      )}>
                        <strong>Admin Comments:</strong> {doc.adminComments}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    