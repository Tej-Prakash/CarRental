
"use client"

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings } from '@/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const currencyOptions: SiteSettings['defaultCurrency'][] = ['USD', 'EUR', 'GBP', 'INR'];

const initialSettings: Partial<SiteSettings> = {
  siteTitle: 'Travel Yatra',
  defaultCurrency: 'INR',
  maintenanceMode: false,
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<Partial<SiteSettings>>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Additional check in layout, but double-check here as well.
    const userString = localStorage.getItem('authUser');
    if (userString) {
        const user = JSON.parse(userString);
        if (user.role !== 'Admin') {
            toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
            router.replace('/admin');
            return;
        }
    } else {
        router.replace('/login'); // Should be caught by layout, but defensive
        return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast({ title: "Authentication Error", description: "No auth token found. Please log in.", variant: "destructive" });
            router.push('/login');
            setIsLoading(false);
            return;
        }
        const response = await fetch('/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          if (response.status === 401) {
            toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            router.push('/login');
          } else if (response.status === 403) { // Handle forbidden specifically
            toast({ title: "Access Denied", description: "You do not have permission to access settings.", variant: "destructive" });
            router.push('/admin');
          } else {
            throw new Error('Failed to fetch settings');
          }
          setIsLoading(false);
          return;
        }
        const data: SiteSettings = await response.json();
        setSettings({
          siteTitle: data.siteTitle || initialSettings.siteTitle,
          defaultCurrency: data.defaultCurrency || initialSettings.defaultCurrency,
          maintenanceMode: data.maintenanceMode ?? initialSettings.maintenanceMode,
        });
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setSettings(initialSettings); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (value: SiteSettings['defaultCurrency']) => {
    setSettings(prev => ({ ...prev, defaultCurrency: value }));
  };

  const handleMaintenanceModeChange = (checked: boolean) => {
    setSettings(prev => ({ ...prev, maintenanceMode: checked }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
          toast({ title: "Authentication Error", description: "Action requires login.", variant: "destructive" });
          router.push('/login');
          setIsSaving(false);
          return;
      }
      const payload: Partial<SiteSettings> = {
        siteTitle: settings.siteTitle,
        defaultCurrency: settings.defaultCurrency,
        maintenanceMode: settings.maintenanceMode,
      };

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
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
            const result = await response.json().catch(()=> ({message: 'Failed to save settings'}));
            const errorMsg = result.errors ? JSON.stringify(result.errors) : result.message;
            throw new Error(errorMsg || 'Failed to save settings');
        }
        setIsSaving(false);
        return;
      }
      const result = await response.json();
      setSettings(result); 
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated.",
      });
    } catch (error: any) {
      toast({ title: "Error Saving Settings", description: error.message, variant: "destructive" });
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
      <AdminPageHeader title="System Settings" description="Configure application-wide settings." />
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl shadow-sm">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage general application settings here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="siteTitle">Application Name (Site Title)</Label>
              <Input 
                id="siteTitle" 
                name="siteTitle"
                value={settings.siteTitle || ''} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select 
                value={settings.defaultCurrency} 
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger id="defaultCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map(currency => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Default Admin Email (Display Only)</Label>
              <Input id="adminEmail" type="email" defaultValue="admin@travelyatra.com" disabled />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode" className="text-base">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access to the public site. Admins can still access /admin.
                </p>
              </div>
              <Switch 
                id="maintenanceMode" 
                aria-label="Toggle maintenance mode"
                checked={settings.maintenanceMode || false}
                onCheckedChange={handleMaintenanceModeChange}
              />
            </div>
             <div className="pt-4">
                <h3 className="text-lg font-medium text-primary">Logo & Favicon Management</h3>
                <p className="text-sm text-muted-foreground">
                  To update the site logo, replace the image file referenced in the Header component or integrate a dynamic URL. 
                  For the favicon, ensure a file named <code>favicon.ico</code> exists in your <code>public</code> directory. 
                  This UI does not support direct logo or favicon file uploads.
                </p>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
