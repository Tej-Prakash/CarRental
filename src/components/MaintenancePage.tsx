
// src/components/MaintenancePage.tsx
import { Wrench } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function MaintenancePage() {
  return (
    <>
      <Header siteTitle="Travel Yatra - Maintenance" />
      <div className="flex flex-col flex-grow items-center justify-center text-center p-6 bg-background">
        <Wrench className="h-24 w-24 text-primary mb-6" />
        <h1 className="text-4xl font-bold text-primary mb-3">Under Maintenance</h1>
        <p className="text-lg text-foreground/80 mb-2">
          Our site is currently undergoing scheduled maintenance.
        </p>
        <p className="text-md text-muted-foreground">
          We expect to be back shortly. Thank you for your patience!
        </p>
      </div>
      <Footer />
    </>
  );
}
