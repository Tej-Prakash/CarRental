
"use client"

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings } from '@/types';
import { Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<SiteSettings>>({ siteTitle: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data: SiteSettings = await response.json();
        setSettings(data);
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        // Set default on error so page is usable
        setSettings({ siteTitle: 'Wheels on Clicks' }); 
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ siteTitle: settings.siteTitle }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save settings');
      }
      setSettings(result); // Update state with saved settings (might include new _id or updatedAt)
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
              <Label htmlFor="adminEmail">Default Admin Email (Display Only)</Label>
              <Input id="adminEmail" type="email" defaultValue="admin@wheelsonclicks.com" disabled />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode" className="text-base">Maintenance Mode (Demo)</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access to the public site.
                </p>
              </div>
              <Switch id="maintenanceMode" aria-label="Toggle maintenance mode" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="currency">Default Currency (Display Only)</Label>
              <Input id="currency" defaultValue="USD" disabled />
            </div>
             <div className="pt-4">
                <h3 className="text-lg font-medium text-primary">Logo & Favicon</h3>
                <p className="text-sm text-muted-foreground">
                  Logo and favicon management is typically handled by deploying new image files 
                  or by integrating with a Content Management System (CMS) or cloud storage. 
                  This UI does not support direct file uploads for these assets.
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
