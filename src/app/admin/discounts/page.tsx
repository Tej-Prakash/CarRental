
"use client";

import { useState, useEffect, FormEvent } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings } from '@/types';
import { Loader2, Percent, Tag, AlertTriangle } from 'lucide-react'; // Added AlertTriangle here
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DEFAULT_GLOBAL_DISCOUNT = 0;

export default function AdminDiscountsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<number | undefined>(DEFAULT_GLOBAL_DISCOUNT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem('authUser');
    if (userString) {
      const user = JSON.parse(userString);
      if (user.role !== 'Admin') {
        toast({ title: "Access Denied", description: "You do not have permission to manage discounts.", variant: "destructive" });
        router.replace('/admin');
        return;
      }
    } else {
      router.replace('/login');
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          toast({ title: "Authentication Error", description: "No auth token found.", variant: "destructive" });
          router.push('/login');
          return;
        }
        const response = await fetch('/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch current settings');
        }
        const data: Partial<SiteSettings> = await response.json();
        setGlobalDiscountPercent(data.globalDiscountPercent ?? DEFAULT_GLOBAL_DISCOUNT);
      } catch (error: any) {
        toast({ title: "Error", description: `Could not load discount settings: ${error.message}`, variant: "destructive" });
      } finally {
        setIsLoading(true);
      }
    };
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGlobalDiscountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalDiscountPercent(value === '' ? undefined : Number(value));
  };

  const handleSaveGlobalDiscount = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    const discountValue = globalDiscountPercent ?? DEFAULT_GLOBAL_DISCOUNT;
    if (discountValue < 0 || discountValue > 100) {
      toast({ title: "Invalid Input", description: "Global discount must be between 0 and 100.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Authentication token not found.");

      // Fetch current settings to preserve other settings
      const settingsResponse = await fetch('/api/admin/settings', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!settingsResponse.ok) throw new Error("Could not fetch current settings to update.");
      const currentSettings: Partial<SiteSettings> = await settingsResponse.json();
      
      // Remove 'id' if it exists as it's not part of the Zod schema for PUT
      delete currentSettings.id;
      delete currentSettings.updatedAt;


      const payload = {
        ...currentSettings,
        globalDiscountPercent: discountValue,
      };
       // Remove smtpPass if it's undefined, so it doesn't get sent as undefined
      if (payload.smtpPass === undefined) {
        delete payload.smtpPass;
      }


      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save global discount.' }));
        throw new Error(errorData.message);
      }
      toast({ title: "Global Discount Updated", description: `Global discount set to ${discountValue}%.` });
    } catch (error: any) {
      toast({ title: "Error Saving Discount", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Discount Management" description="Manage global and individual car discounts." />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Percent className="mr-2 h-5 w-5 text-primary" />Global Discount</CardTitle>
            <CardDescription>
              Set a site-wide discount percentage. This applies to all cars unless a car has its own specific discount set.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveGlobalDiscount}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="globalDiscountPercent">Global Discount Percentage (%)</Label>
                <Input
                  id="globalDiscountPercent"
                  name="globalDiscountPercent"
                  type="number"
                  value={globalDiscountPercent ?? ''}
                  onChange={handleGlobalDiscountChange}
                  min="0" max="100" step="1"
                  placeholder="e.g., 5 for 5%"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter a value between 0 and 100. Set to 0 for no global discount.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Global Discount
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Tag className="mr-2 h-5 w-5 text-primary" />Individual Car Discounts</CardTitle>
            <CardDescription>
              Set specific discount percentages for individual cars. This will override the global discount for those cars.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              To set or modify discounts for specific cars, please go to the Car Management section.
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/cars">Manage Car Discounts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Future Enhancements</AlertTitle>
          <AlertDescription>
            The following discount features are planned for future implementation:
            <ul className="list-disc list-inside mt-2 pl-4 text-sm text-muted-foreground">
              <li>Coupon Code Management (Create, manage, and apply coupon codes).</li>
              <li>Bulk Discount Application (Apply discounts to multiple selected cars at once).</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
