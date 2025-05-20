
"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { User, Address, UserDocument } from '@/types';
import { Loader2, UserCircle, Mail, Home, MapPin, UploadCloud, FileText, ShieldAlert } from 'lucide-react';

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

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ title: "Unauthorized", description: "Please log in to view your profile.", variant: "destructive" });
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch profile');
        }
        const data: User = await response.json();
        setUser(data);
        setName(data.name || '');
        setAddress(data.address || { street: '', city: '', state: '', zip: '', country: '' });
        setLocation(data.location || '');
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setUser(null); // Or handle error state differently
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [router, toast]);

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const token = localStorage.getItem('authToken');

    const updatePayload: Partial<Pick<User, 'name' | 'address' | 'location'>> = {};
    if (name !== user?.name) updatePayload.name = name;
    if (JSON.stringify(address) !== JSON.stringify(user?.address || {})) updatePayload.address = address;
    if (location !== user?.location) updatePayload.location = location;
    
    // Basic validation for address fields if they are partially filled
    const addressFields = Object.values(address);
    const filledAddressFields = addressFields.filter(field => field.trim() !== '').length;
    if (filledAddressFields > 0 && filledAddressFields < Object.keys(address).length) {
        toast({ title: "Incomplete Address", description: "Please fill all address fields or leave them all empty.", variant: "destructive"});
        setIsUpdating(false);
        return;
    }
    if (filledAddressFields === 0) { // If all address fields are empty, don't send address object
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
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update profile');
      
      setUser(result.user); // Update local user state with the response
      setName(result.user.name || '');
      setAddress(result.user.address || { street: '', city: '', state: '', zip: '', country: '' });
      setLocation(result.user.location || '');

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
    try {
      const response = await fetch('/api/profile/documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ documentType, fileName: file.name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Failed to upload ${documentType}`);
      
      setUser(prevUser => ({ ...prevUser!, documents: result.documents }));
      toast({ title: `${documentType} Uploaded`, description: `${file.name} has been recorded (simulation).` });
      if (documentType === 'PhotoID') setPhotoIdFile(null); else setLicenseFile(null);
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      if (documentType === 'PhotoID') setIsUploadingPhotoId(false);
      else setIsUploadingLicense(false);
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
          <CardDescription>Upload your Photo ID and Driving License for verification. (File upload is simulated)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="photoId">Photo ID (e.g., Passport, National ID)</Label>
            <div className="flex gap-2 items-center">
              <Input id="photoId" type="file" onChange={(e) => setPhotoIdFile(e.target.files ? e.target.files[0] : null)} className="flex-grow" />
              <Button onClick={() => handleDocumentUpload('PhotoID', photoIdFile)} disabled={!photoIdFile || isUploadingPhotoId}>
                {isUploadingPhotoId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Upload
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="drivingLicense">Driving License</Label>
            <div className="flex gap-2 items-center">
              <Input id="drivingLicense" type="file" onChange={(e) => setLicenseFile(e.target.files ? e.target.files[0] : null)} className="flex-grow"/>
              <Button onClick={() => handleDocumentUpload('DrivingLicense', licenseFile)} disabled={!licenseFile || isUploadingLicense}>
                {isUploadingLicense && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Upload
              </Button>
            </div>
          </div>
          
          {user.documents && user.documents.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">Uploaded Documents:</h3>
              <ul className="space-y-2">
                {user.documents.map((doc, index) => (
                  <li key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-accent" />
                      <span><strong>{doc.type}:</strong> {doc.fileName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
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

