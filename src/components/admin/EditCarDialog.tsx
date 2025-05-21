
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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Car } from '@/types';
import { Loader2, XCircle, Trash2, UploadCloud, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';
import { UpdateCarInputSchema } from '@/lib/schemas/car';

interface EditCarDialogProps {
  car: Car;
  onCarUpdated: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const isValidHttpUrl = (stringInput: string | undefined): boolean => {
  if (!stringInput) return false;
  try {
    const url = new URL(stringInput);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

export default function EditCarDialog({ car, onCarUpdated, isOpen, onOpenChange }: EditCarDialogProps) {
  const [carData, setCarData] = useState<Partial<Car>>(car);
  const [isLoading, setIsLoading] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageCloudBaseUrl = process.env.NEXT_PUBLIC_IMAGE_CLOUD_BASE_URL;

  useEffect(() => {
    if (isOpen && car) {
      setCarData({
        ...car,
        pricePerHour: car.pricePerHour,
        minNegotiablePrice: car.minNegotiablePrice ?? undefined,
        maxNegotiablePrice: car.maxNegotiablePrice ?? undefined,
        imageUrls: Array.isArray(car.imageUrls) ? car.imageUrls : [],
        features: Array.isArray(car.features) ? car.features : [],
        availability: Array.isArray(car.availability) && car.availability.length > 0 ? car.availability.map(a => ({
          startDate: a.startDate ? new Date(a.startDate).toISOString().split('T')[0] : '',
          endDate: a.endDate ? new Date(a.endDate).toISOString().split('T')[0] : '',
        })) : [{ startDate: '', endDate: '' }],
        aiHint: car.aiHint ?? '',
      });
      setFeatureInput('');
    }
  }, [isOpen, car]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number | undefined = value;
    if (['pricePerHour', 'seats', 'rating', 'reviews', 'minNegotiablePrice', 'maxNegotiablePrice'].includes(name)) {
      parsedValue = value === '' ? undefined : Number(value);
      if (isNaN(Number(parsedValue))) {
        if(value === '') parsedValue = undefined; 
        else return; 
      }
    }
    setCarData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSelectChange = (name: keyof Car, value: string) => {
    setCarData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleFeatureAdd = () => {
    const currentFeatures = carData.features || [];
    if (featureInput.trim() && !currentFeatures.includes(featureInput.trim())) {
      setCarData(prev => ({ ...prev, features: [...currentFeatures, featureInput.trim()] }));
      setFeatureInput('');
    }
  };
  
  const handleFeatureRemove = (featureToRemove: string) => {
    setCarData(prev => ({ ...prev, features: (prev.features || []).filter(f => f !== featureToRemove) }));
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
     if (!imageCloudBaseUrl) {
      toast({
        title: "Configuration Error",
        description: "Image cloud base URL (NEXT_PUBLIC_IMAGE_CLOUD_BASE_URL) is not configured in .env. Image selection is disabled.",
        variant: "destructive",
        duration: 10000,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (!isValidHttpUrl(imageCloudBaseUrl)) {
      toast({
        title: "Configuration Error",
        description: "NEXT_PUBLIC_IMAGE_CLOUD_BASE_URL in .env is not a valid absolute URL (must start with http:// or https://).",
        variant: "destructive",
        duration: 10000,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (files && files.length > 0) {
      const currentImageUrls = carData.imageUrls || [];
      const newImageFullUrls = Array.from(files).map(file => {
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        return `${imageCloudBaseUrl}${Date.now()}-${sanitizedFileName}`;
      });
      
      setCarData(prev => ({ 
        ...prev, 
        imageUrls: [...currentImageUrls, ...newImageFullUrls].slice(0, 5) 
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }
    }
  };

  const handleImageUrlRemove = (urlToRemove: string) => {
    setCarData(prev => ({ ...prev, imageUrls: (prev.imageUrls || []).filter(url => url !== urlToRemove) }));
  };

  const handleAvailabilityChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    const newAvailability = [...(carData.availability || [{ startDate: '', endDate: '' }])];
    newAvailability[index] = { ...newAvailability[index], [field]: value };
    setCarData(prev => ({ ...prev, availability: newAvailability }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!imageCloudBaseUrl || !isValidHttpUrl(imageCloudBaseUrl)) {
      toast({ title: "Configuration Error", description: "Image cloud base URL is not configured correctly. Cannot update car.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if ((carData.imageUrls || []).length === 0) {
        toast({ title: "Validation Error", description: "Please provide at least one image.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const payloadForValidation = {
      ...carData,
      pricePerHour: carData.pricePerHour !== undefined ? Number(carData.pricePerHour) : undefined,
      seats: carData.seats !== undefined ? Number(carData.seats) : undefined,
      rating: carData.rating !== undefined ? Number(carData.rating) : undefined,
      reviews: carData.reviews !== undefined ? Number(carData.reviews) : undefined,
      minNegotiablePrice: carData.minNegotiablePrice !== undefined ? Number(carData.minNegotiablePrice) : undefined,
      maxNegotiablePrice: carData.maxNegotiablePrice !== undefined ? Number(carData.maxNegotiablePrice) : undefined,
      availability: (carData.availability || []).filter(a => a.startDate && a.endDate).map(a => ({
        startDate: new Date(a.startDate).toISOString(),
        endDate: new Date(a.endDate).toISOString(),
      })),
    };

    const validationResult = UpdateCarInputSchema.safeParse(payloadForValidation);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      let errorMessages = "Validation failed: ";
      Object.entries(errors).forEach(([field, messages]) => {
        if (messages) errorMessages += `${field}: ${messages.join(', ')}. `;
      });
      toast({ title: "Validation Error", description: errorMessages, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const finalPayload = { ...validationResult.data };
    delete (finalPayload as any).id; 

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
          toast({ title: "Authentication Error", description: "Action requires login.", variant: "destructive" });
          router.push('/login'); setIsLoading(false); return;
      }
      const response = await fetch(`/api/admin/cars/${car.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(finalPayload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); router.push('/login');
        } else {
          const result = await response.json().catch(()=> ({message: 'Failed to update car'}));
          const errorMsg = result.errors ? JSON.stringify(result.errors) : result.message;
          throw new Error(errorMsg || 'Failed to update car');
        }
      } else {
        toast({ title: "Car Updated", description: `${carData.name || car.name} has been successfully updated.` });
        onOpenChange(false);
        onCarUpdated(); 
      }
    } catch (error: any) {
      toast({ title: "Error Updating Car", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Edit Car: {car.name}</DialogTitle>
          <DialogDescription>
            Update the details for this car listing.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important: Image Handling & Cloud Storage</AlertTitle>
          <AlertDescription>
            Set the <code>NEXT_PUBLIC_IMAGE_CLOUD_BASE_URL</code> in your <code>.env</code> file to your cloud storage base path (e.g., <code>https://your-bucket.s3.amazonaws.com/images/</code>). Ensure it's a full, valid URL ending with a <code>/</code>.
            When you select new image files below, the system constructs full URLs using this base URL, a timestamp, and sanitized filenames.
            <strong className='block my-1'>Action Required: You must manually upload the selected image files to the exact constructed path in your cloud storage for them to be displayed.</strong>
            This system stores the URL; it does not perform the actual file upload. Image selection is disabled if the base URL is not configured or is invalid.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="edit-name">Name</Label><Input id="edit-name" name="name" value={carData.name || ''} onChange={handleChange} required /></div>
            <div><Label htmlFor="edit-type">Type</Label>
              <Select name="type" value={carData.type || 'Sedan'} onValueChange={(value) => handleSelectChange('type', value)}>
                <SelectTrigger id="edit-type"><SelectValue placeholder="Select car type" /></SelectTrigger>
                <SelectContent>
                  {['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van', 'Convertible', 'Coupe'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label htmlFor="edit-pricePerHour">Price Per Hour (₹)</Label><Input id="edit-pricePerHour" name="pricePerHour" type="number" value={carData.pricePerHour ?? ''} onChange={handleChange} required min="0.01" step="0.01" /></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-minNegotiablePrice">Min Negotiable Hourly Price (₹)</Label>
              <Input id="edit-minNegotiablePrice" name="minNegotiablePrice" type="number" value={carData.minNegotiablePrice ?? ''} onChange={handleChange} placeholder="Optional" min="0" step="0.01" />
            </div>
            <div>
              <Label htmlFor="edit-maxNegotiablePrice">Max Negotiable Hourly Price (₹)</Label>
              <Input id="edit-maxNegotiablePrice" name="maxNegotiablePrice" type="number" value={carData.maxNegotiablePrice ?? ''} onChange={handleChange} placeholder="Optional" min="0" step="0.01" />
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-imageUpload">Car Images (Max 5)</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="flex text-sm text-muted-foreground">
                  <Label
                    htmlFor="edit-image-files"
                     className={`relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring ${!imageCloudBaseUrl || !isValidHttpUrl(imageCloudBaseUrl) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>Select new files</span>
                    <input id="edit-image-files" name="image-files" type="file" className="sr-only" multiple onChange={handleImageFileChange} accept="image/*" ref={fileInputRef} disabled={(carData.imageUrls || []).length >= 5 || !imageCloudBaseUrl || !isValidHttpUrl(imageCloudBaseUrl)} />
                  </Label>
                  <p className="pl-1">or drag and drop (visual only)</p>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP supported for selection.</p>
                {(!imageCloudBaseUrl || !isValidHttpUrl(imageCloudBaseUrl)) && <p className="text-xs text-destructive">Image cloud URL not configured or invalid.</p>}
              </div>
            </div>
            
            {(carData.imageUrls || []).length > 0 && (
              <div className="mt-2 space-y-2">
                <Label>Current & Added Images ({(carData.imageUrls || []).length}/5):</Label>
                {(carData.imageUrls || []).map((url, index) => {
                  const isUrlValidForImage = isValidHttpUrl(url);
                  const previewSrc = isUrlValidForImage ? url : `https://placehold.co/40x30.png?text=InvalidURL`;
                  const previewAlt = isUrlValidForImage ? `Preview of ${url.substring(url.lastIndexOf('/') + 1)}` : "Invalid URL format for preview";
                  return (
                    <div key={url + index} className="flex items-center justify-between text-xs p-2 bg-muted rounded-md">
                      <Image 
                          src={previewSrc} 
                          alt={previewAlt}
                          width={40} 
                          height={30} 
                          className="object-cover rounded-sm mr-2 aspect-[4/3]"
                          data-ai-hint="car image" 
                          onError={(e) => { 
                            (e.target as HTMLImageElement).src = `https://placehold.co/40x30.png?text=PreviewErr`; 
                            (e.target as HTMLImageElement).alt = "Preview error";
                          }}
                      />
                      <span className="truncate max-w-[60%] text-ellipsis" title={url.substring(url.lastIndexOf('/') + 1)}>
                          {url.substring(url.lastIndexOf('/') + 1)}
                      </span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleImageUrlRemove(url)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
             {(carData.imageUrls || []).length === 0 && (
                <p className="text-xs text-destructive mt-1">Please select or keep at least one image file.</p>
            )}
          </div>

          <div><Label htmlFor="edit-description">Short Description</Label><Textarea id="edit-description" name="description" value={carData.description || ''} onChange={handleChange} required minLength={10} /></div>
          <div><Label htmlFor="edit-longDescription">Long Description</Label><Textarea id="edit-longDescription" name="longDescription" value={carData.longDescription || ''} onChange={handleChange} required minLength={20}/></div>
          
          <div>
            <Label htmlFor="edit-featureInput">Features</Label>
            <div className="flex gap-2">
              <Input id="edit-featureInput" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder="e.g., GPS Navigation" />
              <Button type="button" variant="outline" onClick={handleFeatureAdd}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(carData.features || []).map(f => (
                <Button key={f} type="button" variant="secondary" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => handleFeatureRemove(f)}>
                  {f} <XCircle className="ml-1 h-3 w-3" />
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Availability (first period)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" name="startDate" aria-label="Start Date" value={carData.availability?.[0]?.startDate || ''} onChange={(e) => handleAvailabilityChange(0, 'startDate', e.target.value)} required />
              <Input type="date" name="endDate" aria-label="End Date" value={carData.availability?.[0]?.endDate || ''} onChange={(e) => handleAvailabilityChange(0, 'endDate', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="edit-seats">Seats</Label><Input id="edit-seats" name="seats" type="number" value={carData.seats ?? ''} onChange={handleChange} required min="1" /></div>
            <div><Label htmlFor="edit-engine">Engine</Label><Input id="edit-engine" name="engine" value={carData.engine || ''} onChange={handleChange} required /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="edit-transmission">Transmission</Label>
              <Select name="transmission" value={carData.transmission || 'Automatic'} onValueChange={(value) => handleSelectChange('transmission', value)}>
                <SelectTrigger id="edit-transmission"><SelectValue placeholder="Select transmission" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">Automatic</SelectItem><SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="edit-fuelType">Fuel Type</Label>
              <Select name="fuelType" value={carData.fuelType || 'Gasoline'} onValueChange={(value) => handleSelectChange('fuelType', value)}>
                <SelectTrigger id="edit-fuelType"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                <SelectContent>
                  {['Gasoline', 'Diesel', 'Electric', 'Hybrid'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label htmlFor="edit-location">Location</Label><Input id="edit-location" name="location" value={carData.location || ''} onChange={handleChange} required /></div>
          <div><Label htmlFor="edit-aiHint">AI Hint (e.g. sedan silver - max 2 words)</Label><Input id="edit-aiHint" name="aiHint" value={carData.aiHint || ''} onChange={handleChange} placeholder="Keywords for primary image" /></div>

          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isLoading || (carData.imageUrls || []).length === 0 || !imageCloudBaseUrl || !isValidHttpUrl(imageCloudBaseUrl)}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Car
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
