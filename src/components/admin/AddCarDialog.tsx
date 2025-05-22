
"use client";

import * as React from 'react';
import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Car } from '@/types';
import { Loader2, XCircle, Trash2, ImagePlus, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddCarDialogProps {
  onCarAdded: () => void;
  children: React.ReactNode; 
}

const initialCarState: Omit<Car, 'id' | 'rating' | 'reviews'> & { rating?: number; reviews?: number } = {
  name: '',
  type: 'Sedan',
  pricePerHour: 10,
  minNegotiablePrice: undefined,
  maxNegotiablePrice: undefined,
  imageUrls: [],
  description: '',
  longDescription: '',
  features: [],
  availability: [{ startDate: '', endDate: '' }],
  seats: 4,
  engine: '',
  transmission: 'Automatic',
  fuelType: 'Petrol',
  location: '',
  aiHint: '',
  rating: 0,
  reviews: 0,
};


export default function AddCarDialog({ onCarAdded, children }: AddCarDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [carData, setCarData] = useState(initialCarState);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number | undefined = value;
    if (['pricePerHour', 'seats', 'rating', 'reviews', 'minNegotiablePrice', 'maxNegotiablePrice'].includes(name)) {
      parsedValue = value === '' ? undefined : Number(value);
    }
    setCarData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSelectChange = (name: keyof Omit<Car, 'id'>, value: string) => {
    setCarData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleFeatureAdd = () => {
    if (featureInput.trim() && !carData.features.includes(featureInput.trim())) {
      setCarData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
      setFeatureInput('');
    }
  };
  
  const handleFeatureRemove = (featureToRemove: string) => {
    setCarData(prev => ({ ...prev, features: prev.features.filter(f => f !== featureToRemove) }));
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if ((carData.imageUrls || []).length + files.length > 5) {
      toast({
        title: "Image Limit Exceeded",
        description: "You can upload a maximum of 5 images.",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Error", description: "Action requires login.", variant: "destructive" });
      router.push('/login');
      setIsUploading(false);
      return;
    }
    
    const uploadedPaths: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        const result = await response.json();
        if (response.ok && result.success && result.filePath) {
          uploadedPaths.push(result.filePath); 
        } else {
          toast({
            title: `Failed to upload ${file.name}`,
            description: result.message || "Unknown error during upload.",
            variant: "destructive",
          });
        }
      } catch (uploadError: any) {
        toast({
          title: `Error uploading ${file.name}`,
          description: uploadError.message || "Network or server error.",
          variant: "destructive",
        });
      }
    }
    
    if (uploadedPaths.length > 0) {
      setCarData(prev => ({ 
        ...prev, 
        imageUrls: [...(prev.imageUrls || []), ...uploadedPaths].slice(0, 5) 
      }));
    }
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const handleImageUrlRemove = (urlToRemove: string) => {
    setCarData(prev => ({ ...prev, imageUrls: (prev.imageUrls || []).filter(url => url !== urlToRemove) }));
  };


  const handleAvailabilityChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    const newAvailability = [...carData.availability];
    newAvailability[index] = { ...newAvailability[index], [field]: value };
    setCarData(prev => ({ ...prev, availability: newAvailability }));
  };
  
  const resetForm = () => {
    setCarData(initialCarState);
    setFeatureInput('');
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if ((carData.imageUrls || []).length === 0) {
      toast({ title: "Validation Error", description: "Please upload at least one image.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const payload = {
      ...carData,
      imageUrls: carData.imageUrls || [], 
      pricePerHour: Number(carData.pricePerHour),
      seats: Number(carData.seats),
      rating: Number(carData.rating || 0),
      reviews: Number(carData.reviews || 0),
      minNegotiablePrice: carData.minNegotiablePrice ? Number(carData.minNegotiablePrice) : undefined,
      maxNegotiablePrice: carData.maxNegotiablePrice ? Number(carData.maxNegotiablePrice) : undefined,
    };
    
    if (payload.pricePerHour <= 0) {
         toast({ title: "Validation Error", description: "Price per hour must be greater than 0.", variant: "destructive" });
         setIsLoading(false);
         return;
    }
     if (payload.seats <= 0) {
         toast({ title: "Validation Error", description: "Number of seats must be greater than 0.", variant: "destructive" });
         setIsLoading(false);
         return;
    }
    if (payload.minNegotiablePrice && payload.minNegotiablePrice > payload.pricePerHour) {
        toast({ title: "Validation Error", description: "Min negotiable hourly price cannot exceed hourly price.", variant: "destructive" });
        setIsLoading(false); return;
    }
    if (payload.maxNegotiablePrice && payload.maxNegotiablePrice < payload.pricePerHour) {
        toast({ title: "Validation Error", description: "Max negotiable hourly price cannot be less than hourly price.", variant: "destructive" });
        setIsLoading(false); return;
    }
    if (payload.minNegotiablePrice && payload.maxNegotiablePrice && payload.minNegotiablePrice > payload.maxNegotiablePrice) {
        toast({ title: "Validation Error", description: "Min negotiable hourly price cannot exceed max negotiable hourly price.", variant: "destructive" });
        setIsLoading(false); return;
    }
    if (!payload.availability[0]?.startDate || !payload.availability[0]?.endDate) {
        toast({ title: "Validation Error", description: "Please provide at least one availability start and end date.", variant: "destructive" });
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
      const response = await fetch('/api/admin/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload), 
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          router.push('/login');
        } else {
          const result = await response.json().catch(()=> ({message: 'Failed to add car'}));
          const errorMsg = result.errors ? JSON.stringify(result.errors) : result.message;
          throw new Error(errorMsg || 'Failed to add car');
        }
      } else {
        const result = await response.json();
        toast({ title: "Car Added", description: `${result.name} has been successfully added.` });
        setIsOpen(false);
        onCarAdded(); 
      }
    } catch (error: any) {
      toast({ title: "Error Adding Car", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Add New Car</DialogTitle>
          <DialogDescription>
            Fill in the details for the new car listing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="name">Name</Label><Input id="name" name="name" value={carData.name} onChange={handleChange} required /></div>
            <div><Label htmlFor="type">Type</Label>
              <Select name="type" value={carData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                <SelectTrigger id="type"><SelectValue placeholder="Select car type" /></SelectTrigger>
                <SelectContent>
                  {['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van', 'Convertible', 'Coupe'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label htmlFor="pricePerHour">Price Per Hour (₹)</Label><Input id="pricePerHour" name="pricePerHour" type="number" value={carData.pricePerHour} onChange={handleChange} required min="0.01" step="0.01" /></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minNegotiablePrice">Min Negotiable Hourly Price (₹)</Label>
              <Input id="minNegotiablePrice" name="minNegotiablePrice" type="number" value={carData.minNegotiablePrice ?? ''} onChange={handleChange} placeholder="Optional" min="0" step="0.01" />
            </div>
            <div>
              <Label htmlFor="maxNegotiablePrice">Max Negotiable Hourly Price (₹)</Label>
              <Input id="maxNegotiablePrice" name="maxNegotiablePrice" type="number" value={carData.maxNegotiablePrice ?? ''} onChange={handleChange} placeholder="Optional" min="0" step="0.01" />
            </div>
          </div>
          
          <div>
            <Label htmlFor="imageUpload">Upload Car Images (Max 5)</Label>
            
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="flex text-sm text-muted-foreground">
                  <Label
                    htmlFor="image-files"
                    className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring"
                  >
                    <span>Select files</span>
                    <input id="image-files" name="image-files" type="file" className="sr-only" multiple onChange={handleImageFileChange} accept="image/jpeg,image/png,image/gif,image/webp" ref={fileInputRef} disabled={(carData.imageUrls || []).length >= 5 || isUploading} />
                  </Label>
                  <p className="pl-1">or drag and drop (visual only)</p>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP up to 5MB each.</p>
                {isUploading && <div className="flex items-center justify-center text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin mr-1" /> Uploading...</div>}
              </div>
            </div>
            
            {(carData.imageUrls || []).length > 0 && (
              <div className="mt-2 space-y-2">
                <Label>Uploaded Images ({(carData.imageUrls || []).length}/5):</Label>
                {(carData.imageUrls || []).map((url, index) => (
                    <div key={url + index} className="flex items-center justify-between text-xs p-2 bg-muted rounded-md">
                       <Image 
                          src={url} 
                          alt={`Preview of ${url.substring(url.lastIndexOf('/') + 1)}`}
                          width={40} 
                          height={30} 
                          className="object-cover rounded-sm mr-2 aspect-[4/3]"
                          onError={(e) => { 
                            (e.target as HTMLImageElement).src = `https://placehold.co/40x30.png?text=Err`; 
                            (e.target as HTMLImageElement).alt = "Preview error";
                          }}
                      />
                      <span className="truncate max-w-[60%] text-ellipsis" title={url.substring(url.lastIndexOf('/') + 1)}>
                          {url.substring(url.lastIndexOf('/') + 1)}
                      </span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleImageUrlRemove(url)} disabled={isUploading}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
             {(carData.imageUrls || []).length === 0 && (
                <p className="text-xs text-destructive mt-1">Please upload at least one image file.</p>
            )}
          </div>

          <div><Label htmlFor="description">Short Description</Label><Textarea id="description" name="description" value={carData.description} onChange={handleChange} required minLength={10} /></div>
          <div><Label htmlFor="longDescription">Long Description</Label><Textarea id="longDescription" name="longDescription" value={carData.longDescription} onChange={handleChange} required minLength={20}/></div>
          
          <div>
            <Label htmlFor="featureInput">Features</Label>
            <div className="flex gap-2">
              <Input id="featureInput" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder="e.g., GPS Navigation" />
              <Button type="button" variant="outline" onClick={handleFeatureAdd}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {carData.features.map(f => (
                <Button key={f} type="button" variant="secondary" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => handleFeatureRemove(f)}>
                  {f} <XCircle className="ml-1 h-3 w-3" />
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Availability (first period)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" name="startDate" aria-label="Start Date" value={carData.availability[0].startDate} onChange={(e) => handleAvailabilityChange(0, 'startDate', e.target.value)} required />
              <Input type="date" name="endDate" aria-label="End Date" value={carData.availability[0].endDate} onChange={(e) => handleAvailabilityChange(0, 'endDate', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="seats">Seats</Label><Input id="seats" name="seats" type="number" value={carData.seats} onChange={handleChange} required min="1" /></div>
            <div><Label htmlFor="engine">Engine</Label><Input id="engine" name="engine" value={carData.engine} onChange={handleChange} required /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="transmission">Transmission</Label>
              <Select name="transmission" value={carData.transmission} onValueChange={(value) => handleSelectChange('transmission', value)}>
                <SelectTrigger id="transmission"><SelectValue placeholder="Select transmission" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">Automatic</SelectItem><SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="fuelType">Fuel Type</Label>
              <Select name="fuelType" value={carData.fuelType} onValueChange={(value) => handleSelectChange('fuelType', value)}>
                <SelectTrigger id="fuelType"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                <SelectContent>
                  {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label htmlFor="location">Location</Label><Input id="location" name="location" value={carData.location} onChange={handleChange} required /></div>
          <div><Label htmlFor="aiHint">AI Hint (e.g. sedan silver - max 2 words)</Label><Input id="aiHint" name="aiHint" value={carData.aiHint || ''} onChange={handleChange} placeholder="Keywords for primary image" /></div>

          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isLoading || isUploading || (carData.imageUrls || []).length === 0}>
              {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Car
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
