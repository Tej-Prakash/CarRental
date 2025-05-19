"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { mockCars } from '@/lib/mockData';
import type { Car } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, CheckCircle, DollarSign, Fuel, Gauge, GitCommitVertical, MapPin, MessageCircle, ShieldCheck, Star, Users, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ChatbotDialog from '@/components/ChatbotDialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface CarDetailsPageProps {
  params: { id: string };
}

export default function CarDetailsPage({ params }: CarDetailsPageProps) {
  const [car, setCar] = useState<Car | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const foundCar = mockCars.find(c => c.id === params.id);
    setCar(foundCar || null);
  }, [params.id]);

  if (!car) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-semibold">Car not found</h1>
        <p className="text-muted-foreground">The car you are looking for does not exist or has been removed.</p>
        <Button asChild className="mt-4">
          <Link href="/cars">Back to Cars</Link>
        </Button>
      </div>
    );
  }
  
  const handleBookNow = () => {
    toast({
      title: "Booking Initiated (Demo)",
      description: `You've started the booking process for ${car.name}. This is a demo feature.`,
    });
    // Actual booking logic would go here
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-video md:aspect-auto min-h-[300px] md:min-h-[400px]">
            <Image 
              src={car.imageUrl} 
              alt={car.name} 
              fill 
              className="object-cover"
              data-ai-hint={car.aiHint}
              priority
            />
          </div>
          <div className="p-6 md:p-8 flex flex-col">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{car.name}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">{car.type}</CardDescription>
            </CardHeader>
            
            <CardContent className="p-0 flex-grow space-y-4">
              <p className="text-foreground/90 text-base">{car.longDescription}</p>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <InfoItem icon={<Users className="h-5 w-5 text-accent" />} label={`${car.seats} Seats`} />
                <InfoItem icon={<Gauge className="h-5 w-5 text-accent" />} label={car.engine} />
                <InfoItem icon={<GitCommitVertical className="h-5 w-5 text-accent" />} label={car.transmission} />
                <InfoItem icon={<Fuel className="h-5 w-5 text-accent" />} label={car.fuelType} />
                <InfoItem icon={<MapPin className="h-5 w-5 text-accent" />} label={`Location: ${car.location}`} />
                <InfoItem icon={<Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />} label={`${car.rating.toFixed(1)} (${car.reviews} reviews)`} />
              </div>

              <div>
                <h3 className="font-semibold text-md mb-2 text-primary">Key Features:</h3>
                <div className="flex flex-wrap gap-2">
                  {car.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs">{feature}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-0 mt-6 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-3xl font-bold text-primary">${car.pricePerDay}</p>
                <p className="text-sm text-muted-foreground">per day</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button size="lg" variant="outline" onClick={() => setIsChatbotOpen(true)} className="w-full sm:w-auto">
                  <MessageCircle className="mr-2 h-5 w-5" /> Negotiate Price
                </Button>
                <Button size="lg" onClick={handleBookNow} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                  <DollarSign className="mr-2 h-5 w-5" /> Book Now
                </Button>
              </div>
            </CardFooter>
          </div>
        </div>
      </Card>

      {/* Availability Section Placeholder */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary flex items-center">
            <CalendarDays className="mr-2 h-6 w-6 text-accent" /> Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This car is generally available from {new Date(car.availability[0].startDate).toLocaleDateString()} to {new Date(car.availability[0].endDate).toLocaleDateString()}.
            Specific date selection will be available during the booking process.
          </p>
          {/* Placeholder for a calendar or date range picker */}
        </CardContent>
      </Card>

      <ChatbotDialog 
        isOpen={isChatbotOpen} 
        onOpenChange={setIsChatbotOpen} 
        car={car} 
      />
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
}

function InfoItem({ icon, label }: InfoItemProps) {
  return (
    <div className="flex items-center">
      {icon}
      <span className="ml-2 text-foreground/90">{label}</span>
    </div>
  );
}
