
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Navigation, ShieldCheck, Tag, MapPin, CalendarDays, ClockIcon, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import CarCardHome from "@/components/CarCardHome"; // New component for homepage car cards
import type { Car as CarType } from "@/types";
import { useEffect, useState } from "react";

const benefits = [
  {
    icon: <Tag className="h-10 w-10 text-accent" />,
    title: "Best Price Guarantee",
    description: "Find the best deals and negotiate prices with our AI assistant."
  },
  {
    icon: <Navigation className="h-10 w-10 text-accent" />,
    title: "Wide Range of Cars",
    description: "From luxury sedans to rugged SUVs, we have a car for every need."
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-accent" />,
    title: "Safe & Secure",
    description: "All our vehicles are well-maintained and insured for your peace of mind."
  }
];

export default function HomePage() {
  const [rentalType, setRentalType] = useState<'self-drive' | 'outstation' | 'monthly'>('self-drive');
  const [recentlyAddedCars, setRecentlyAddedCars] = useState<CarType[]>([]);
  const [isLoadingCars, setIsLoadingCars] = useState(true);

  useEffect(() => {
    const fetchRecentCars = async () => {
      setIsLoadingCars(true);
      try {
        const response = await fetch('/api/cars?limit=5'); // Fetch 5 cars
        if (response.ok) {
          const data = await response.json();
          setRecentlyAddedCars(data.data);
        } else {
          console.error("Failed to fetch recent cars");
          setRecentlyAddedCars([]);
        }
      } catch (error) {
        console.error("Error fetching recent cars:", error);
        setRecentlyAddedCars([]);
      } finally {
        setIsLoadingCars(false);
      }
    };
    fetchRecentCars();
  }, []);

  return (
    <div className="space-y-0"> {/* Removed top-level space-y-12 */}
      {/* New Search/Rental Section */}
      <section className="bg-sky-500 text-white py-10 md:py-16 relative overflow-hidden">
        {/* Subtle background pattern - omitted for simplicity, can be added with CSS */}
        <div className="container mx-auto px-4 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 z-10">
            <div className="mb-6 flex space-x-1">
              {['Self drive', 'Outstation', 'Monthly'].map((type) => (
                <Button
                  key={type}
                  variant={rentalType === type.toLowerCase().replace(' ', '-') ? 'default' : 'ghost'}
                  onClick={() => setRentalType(type.toLowerCase().replace(' ', '-') as any)}
                  className={`
                    rounded-t-md rounded-b-none px-4 py-2 text-sm font-medium
                    ${rentalType === type.toLowerCase().replace(' ', '-') ? 
                      'bg-white text-sky-600 shadow-md' : 
                      'text-white hover:bg-white/20 hover:text-white'}
                  `}
                >
                  {type}
                </Button>
              ))}
            </div>
            <Card className="bg-white/95 backdrop-blur-sm text-card-foreground shadow-2xl rounded-xl p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl font-bold text-primary">Rental</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="text" placeholder="Select Location" className="pl-10 text-foreground h-12" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                     <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="text" placeholder="Start Date & Time" className="pl-10 text-foreground h-12" onFocus={(e) => e.target.type='datetime-local'} onBlur={(e) => e.target.type='text'}/>
                  </div>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="text" placeholder="End Date & Time" className="pl-10 text-foreground h-12" onFocus={(e) => e.target.type='datetime-local'} onBlur={(e) => e.target.type='text'}/>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8">Search</Button>
                  <p className="text-sm text-primary">Duration: -- day -- hr</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-5 z-10 text-left md:pl-8">
            <h2 className="text-3xl font-bold mb-4 leading-tight">Self drive car rentals in India</h2>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-300" /> Emi option available for monthly Subscription
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-300" /> Find the best deal for a monthly subscription.
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-300" /> Pay weekly or monthly for subscription.
              </li>
            </ul>
            <h3 className="text-lg font-semibold mb-1">Our Reviews Rated Info</h3>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-6 w-6 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : (i < 4.9 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')}`} /> // Simplified for 4.9
              ))}
              <span className="ml-2 text-lg font-semibold">4.9</span>
              <span className="ml-1 text-sm opacity-90">(9032 reviews)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Added Cars Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-primary">Recently Added Cars</h2>
            <Button variant="link" asChild className="text-accent hover:text-accent/80">
              <Link href="/cars">View More &gt;</Link>
            </Button>
          </div>
          {isLoadingCars ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3 animate-pulse bg-card">
                        <div className="aspect-video bg-muted rounded-md"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="flex justify-between items-center">
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="h-8 bg-muted rounded w-1/3"></div>
                        </div>
                    </div>
                ))}
             </div>
          ) : recentlyAddedCars.length > 0 ? (
            <div className="relative">
              <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {recentlyAddedCars.map((car) => (
                  <div key={car.id} className="min-w-[280px] max-w-[300px] flex-shrink-0">
                    <CarCardHome car={car} />
                  </div>
                ))}
              </div>
              {/* Decorative Arrows - functionality can be added with JS if needed */}
              <Button variant="outline" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-md hidden md:flex z-10">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button variant="outline" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-md hidden md:flex z-10">
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No recently added cars to display.</p>
          )}
        </div>
      </section>

      {/* Existing "Why Choose Us?" Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 text-primary">Why Choose Us?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="mx-auto bg-accent/10 p-4 rounded-full w-fit mb-4">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-primary">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Existing "How it Works Section" - slightly adjusted margin */}
      <section className="py-12 md:py-16 bg-secondary/50 rounded-lg">
         <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10 text-primary">Easy Steps to Your Next Ride</h2>
            <div className="grid md:grid-cols-3 gap-8 items-start">
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold mb-4">1</div>
                <Image src="https://placehold.co/300x200.png" alt="Search for cars" data-ai-hint="searching computer" width={300} height={200} className="rounded-md mb-4 shadow-md" />
                <h3 className="text-xl font-semibold mb-2 text-primary">Search & Filter</h3>
                <p className="text-foreground/80">Easily find the perfect car by type, date, and price.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold mb-4">2</div>
                <Image src="https://placehold.co/300x200.png" alt="Negotiate price" data-ai-hint="chat negotiation" width={300} height={200} className="rounded-md mb-4 shadow-md" />
                <h3 className="text-xl font-semibold mb-2 text-primary">Negotiate Price</h3>
                <p className="text-foreground/80">Use our AI chatbot to get the best possible deal.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold mb-4">3</div>
                <Image src="https://placehold.co/300x200.png" alt="Book your car" data-ai-hint="driving car" width={300} height={200} className="rounded-md mb-4 shadow-md" />
                <h3 className="text-xl font-semibold mb-2 text-primary">Book & Drive</h3>
                <p className="text-foreground/80">Confirm your booking and enjoy your journey.</p>
              </div>
            </div>
        </div>
      </section>
    </div>
  );
}

    