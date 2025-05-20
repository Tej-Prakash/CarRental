
"use client";

import * as React from 'react'; // Added React import
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
import { Loader2, XCircle, Trash2, UploadCloud } from 'lucide-react';

interface AddCarDialogProps {
  onCarAdded: () => void;
  children: React.ReactNode; 
}

const initialCarState: Omit<Car, 'id' | 'rating' | 'reviews'> & { rating?: number; reviews?: number } = {
  name: '',
  type: 'Sedan',
  pricePerDay: 50,
  imageUrls: [], // Start with an empty array for images
  description: '',
  longDescription: '',
  features: [],
  availability: [{ startDate: '', endDate: '' }],
  seats: 4,
  engine: '',
  transmission: 'Automatic',
  fuelType: 'Gasoline',
  location: '',
  aiHint: '',
  rating: 0,
  reviews: 0,
};


export default function AddCarDialog({ onCarAdded, children }: AddCarDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [carData, setCarData] = useState(initialCarState);
  const [isLoading, setIsLoading] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;
    if (name === 'pricePerDay' || name === 'seats' || name === 'rating' || name === 'reviews') {
      parsedValue = value === '' ? '' : Number(value);
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

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImageUrls = Array.from(files).map(file => {
        // Simulate URL generation. In a real app, you'd upload then get a URL.
        // Here, we use placeholder.co with the file name for demonstration.
        return `https://placehold.co/600x400.png?text=${encodeURIComponent(file.name)}`;
      });
      setCarData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...newImageUrls] }));
       // Clear the file input for next selection
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageUrlRemove = (urlToRemove: string) => {
    setCarData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter(url => url !== urlToRemove) }));
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

    if (carData.imageUrls.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one image by selecting files.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const payload = {
      ...carData,
      pricePerDay: Number(carData.pricePerDay),
      seats: Number(carData.seats),
      rating: Number(carData.rating || 0),
      reviews: Number(carData.reviews || 0),
    };
    
    if (payload.pricePerDay <= 0) {
         toast({ title: "Validation Error", description: "Price per day must be greater than 0.", variant: "destructive" });
         setIsLoading(false);
         return;
    }
     if (payload.seats <= 0) {
         toast({ title: "Validation Error", description: "Number of seats must be greater than 0.", variant: "destructive" });
         setIsLoading(false);
         return;
    }
    if (!payload.availability[0]?.startDate || !payload.availability[0]?.endDate) {
        toast({ title: "Validation Error", description: "Please provide at least one availability start and end date.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.errors ? JSON.stringify(result.errors) : result.message;
        throw new Error(errorMsg || 'Failed to add car');
      }

      toast({ title: "Car Added", description: `${result.name} has been successfully added.` });
      setIsOpen(false);
      onCarAdded(); 
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
          <div><Label htmlFor="pricePerDay">Price Per Day ($)</Label><Input id="pricePerDay" name="pricePerDay" type="number" value={carData.pricePerDay} onChange={handleChange} required min="0.01" step="0.01" /></div>
          
          {/* Image Upload Simulation */}
          <div>
            <Label htmlFor="imageUpload">Upload Car Images</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="flex text-sm text-muted-foreground">
                  <Label
                    htmlFor="image-files"
                    className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring"
                  >
                    <span>Select files</span>
                    <input id="image-files" name="image-files" type="file" className="sr-only" multiple onChange={handleImageFileChange} accept="image/*" ref={fileInputRef} />
                  </Label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB (simulated)</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Note: This simulates file selection. Placeholder images will be generated. For real use, ensure images are hosted and actual URLs are managed.
            </p>
            {carData.imageUrls.length > 0 && (
              <div className="mt-2 space-y-1">
                <Label>Selected Images (Placeholders):</Label>
                {carData.imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted rounded-md">
                    <img src={url} alt={`Preview ${index + 1}`} className="h-10 w-10 object-cover rounded-sm mr-2"/>
                    <span className="truncate max-w-[70%]">{decodeURIComponent(url.substring(url.indexOf("?text=") + 6))}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleImageUrlRemove(url)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
             {carData.imageUrls.length === 0 && (
                <p className="text-xs text-destructive mt-1">Please select at least one image.</p>
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
                  {['Gasoline', 'Diesel', 'Electric', 'Hybrid'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label htmlFor="location">Location</Label><Input id="location" name="location" value={carData.location} onChange={handleChange} required /></div>
          <div><Label htmlFor="aiHint">AI Hint (e.g. sedan silver)</Label><Input id="aiHint" name="aiHint" value={carData.aiHint || ''} onChange={handleChange} placeholder="Keywords for primary image" /></div>

          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isLoading || carData.imageUrls.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Car
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    

    