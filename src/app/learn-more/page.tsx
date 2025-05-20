
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Bot, Users, DollarSign } from "lucide-react";

const features = [
  {
    icon: <Bot className="h-8 w-8 text-accent" />,
    title: "AI-Powered Price Negotiation",
    description: "Our unique chatbot allows you to negotiate rental prices in real-time, ensuring you get the best possible deal tailored to your budget."
  },
  {
    icon: <Users className="h-8 w-8 text-accent" />,
    title: "Diverse Vehicle Fleet",
    description: "From compact cars for city driving to spacious SUVs for family trips and luxury vehicles for special occasions, find the perfect car for any need."
  },
  {
    icon: <DollarSign className="h-8 w-8 text-accent" />,
    title: "Transparent Pricing",
    description: "No hidden fees or surprises. Our pricing is straightforward, and our negotiation tool helps you understand how deals are structured."
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-accent" />,
    title: "Easy & Secure Booking",
    description: "Our streamlined booking process is fast, user-friendly, and secure, getting you on the road with minimal hassle."
  }
];

export default function LearnMorePage() {
  return (
    <div className="container mx-auto py-12 px-4 space-y-12">
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
          Discover Travel Yatra
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
          Learn more about our innovative features, commitment to value, and how we're revolutionizing the car rental experience.
        </p>
      </section>

      <section>
        <Card className="shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 items-center">
                <div className="p-6 md:p-8">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-3xl text-primary">Why Rent With Us?</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        <p className="text-foreground/90 leading-relaxed">
                        At Travel Yatra, we're not just another car rental service. We're a technology-driven platform designed to put you in control. We understand that finding the right car at the right price can be challenging, which is why we've built tools to make the process simpler, more transparent, and more engaging.
                        </p>
                        <p className="text-foreground/90 leading-relaxed">
                        Our core philosophy is built on providing exceptional value through innovation. Whether it's our AI negotiation assistant or our meticulously curated fleet, every aspect of Travel Yatra is designed with your satisfaction in mind.
                        </p>
                    </CardContent>
                 </div>
                <div className="relative h-64 md:h-full min-h-[300px]">
                    <Image 
                        src="https://placehold.co/800x600.png" 
                        alt="Scenic driving route" 
                        fill
                        className="object-cover"
                        data-ai-hint="scenic road cars" 
                    />
                </div>
            </div>
        </Card>
      </section>

      <section className="py-8">
        <h2 className="text-3xl font-bold text-center mb-10 text-primary">Key Features That Set Us Apart</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center mb-3">
                  {feature.icon}
                  <CardTitle className="text-xl font-semibold text-primary ml-3">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="text-center py-8 bg-secondary/50 rounded-lg">
        <h2 className="text-3xl font-bold text-primary mb-4">Ready to Find Your Perfect Ride?</h2>
        <p className="text-lg text-foreground/80 mb-6 max-w-2xl mx-auto">
          Experience the Travel Yatra difference today. Browse our cars and start negotiating your best deal.
        </p>
        <Button size="lg" asChild>
          <Link href="/cars">Browse Cars Now</Link>
        </Button>
      </section>
    </div>
  );
}
