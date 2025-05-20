
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Navigation, ShieldCheck, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <section className="text-center py-12 md:py-20 bg-card rounded-lg shadow-lg">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Welcome to Travel Yatra
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            Discover the freedom of the open road with our premium car rental service. We offer a diverse fleet, competitive prices, and a seamless booking experience.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/cars">Browse Cars</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/learn-more">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-12">
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
      </section>

      {/* How it Works Section */}
      <section className="py-12 bg-secondary/50 rounded-lg">
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
      </section>
    </div>
  );
}
