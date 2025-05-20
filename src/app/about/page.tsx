
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Building, Users, Target } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="container mx-auto py-12 px-4 space-y-12">
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
          About Travel Yatra
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
          Discover the story behind Travel Yatra and our commitment to providing you with an exceptional car rental experience.
        </p>
      </section>

      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center">
              <Building className="h-7 w-7 mr-3 text-accent" /> Our Company
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-foreground/90 leading-relaxed">
                  Travel Yatra was founded with a simple mission: to make car rental easy, affordable, and enjoyable. We believe that everyone deserves access to reliable transportation, whether for a business trip, a family vacation, or just a weekend getaway. Our platform connects you with a wide variety of vehicles to suit your needs, all at competitive prices.
                </p>
                <p className="text-foreground/90 leading-relaxed mt-4">
                  We leverage technology to streamline the booking process, from browsing our extensive fleet to negotiating the best deals with our innovative AI-powered chatbot. Our commitment to customer satisfaction drives everything we do.
                </p>
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-md">
                <Image 
                  src="https://placehold.co/600x400.png" 
                  alt="Our Team" 
                  fill 
                  className="object-cover"
                  data-ai-hint="office team"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <Users className="h-6 w-6 mr-2 text-accent" /> Our Values
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p><strong className="text-primary">Customer Focus:</strong> Your needs are our top priority. We strive to provide outstanding service and support.</p>
            <p><strong className="text-primary">Transparency:</strong> Clear pricing, no hidden fees. What you see is what you get.</p>
            <p><strong className="text-primary">Innovation:</strong> Continuously improving our platform and services to enhance your experience.</p>
            <p><strong className="text-primary">Reliability:</strong> Well-maintained vehicles and dependable service you can count on.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <Target className="h-6 w-6 mr-2 text-accent" /> Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 leading-relaxed">
              To be the leading car rental platform, recognized for our exceptional value, innovative technology, and unwavering commitment to customer satisfaction. We aim to empower travelers with the freedom and flexibility to explore the world on their own terms.
            </p>
             <div className="relative aspect-video rounded-lg overflow-hidden shadow-md mt-4">
                <Image 
                  src="https://placehold.co/600x400.png" 
                  alt="Happy customer driving" 
                  fill 
                  className="object-cover"
                  data-ai-hint="happy customer driving"
                />
              </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
