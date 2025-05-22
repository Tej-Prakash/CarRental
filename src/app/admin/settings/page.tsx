
"use client"

import { useState, useEffect, FormEvent } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings } from '@/types';
import { Loader2, AlertTriangle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

const currencyOptions: SiteSettings['defaultCurrency'][] = ['USD', 'EUR', 'GBP', 'INR'];
const DEFAULT_SESSION_TIMEOUT_MINUTES = 60;

const initialSettings: Partial<SiteSettings> = {
  siteTitle: 'Travel Yatra',
  defaultCurrency: 'INR',
  maintenanceMode: false,
  sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '', 
  smtpSecure: false,
  emailFrom: '',
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<Partial<SiteSettings>>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSmtpPass, setCurrentSmtpPass] = useState(''); 
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem('authUser');
    if (userString) {
        const user = JSON.parse(userString);
        if (user.role !== 'Admin') {
            toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
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
          } else if (response.status === 403) {
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
          ...initialSettings, 
          ...data,
          smtpPass: undefined, 
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
    const { name, value, type } = event.target;
    if (name === "smtpPass") {
      setCurrentSmtpPass(value); 
      return;
    }
    setSettings(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value 
    }));
  };
  
  const handleSwitchChange = (name: keyof SiteSettings, checked: boolean) => {
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleCurrencyChange = (value: SiteSettings['defaultCurrency']) => {
    setSettings(prev => ({ ...prev, defaultCurrency: value }));
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
        ...settings,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes ? Number(settings.sessionTimeoutMinutes) : DEFAULT_SESSION_TIMEOUT_MINUTES,
        smtpPort: settings.smtpPort ? Number(settings.smtpPort) : undefined,
      };

      if (currentSmtpPass && currentSmtpPass.trim() !== '') {
        payload.smtpPass = currentSmtpPass;
      } else {
        delete payload.smtpPass; 
      }


      if (payload.sessionTimeoutMinutes && payload.sessionTimeoutMinutes < 1) {
        toast({ title: "Invalid Input", description: "Session timeout must be at least 1 minute.", variant: "destructive" });
        setIsSaving(false);
        return;
      }
      if (payload.smtpPort && (payload.smtpPort < 1 || payload.smtpPort > 65535)) {
        toast({ title: "Invalid Input", description: "SMTP Port must be between 1 and 65535.", variant: "destructive" });
        setIsSaving(false);
        return;
      }


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
      const result: SiteSettings = await response.json();
      setCurrentSmtpPass(''); 
      setSettings({
        ...initialSettings,
        ...result,
        smtpPass: undefined, 
      });
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
        <Card className="max-w-2xl shadow-sm mb-6">
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
              <Label htmlFor="sessionTimeoutMinutes">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeoutMinutes"
                name="sessionTimeoutMinutes"
                type="number"
                value={settings.sessionTimeoutMinutes || DEFAULT_SESSION_TIMEOUT_MINUTES}
                onChange={handleInputChange}
                min="1"
                placeholder={`Default: ${DEFAULT_SESSION_TIMEOUT_MINUTES}`}
              />
               <p className="text-xs text-muted-foreground">
                How long a user session remains active (e.g., 60 for 1 hour).
              </p>
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
                onCheckedChange={(checked) => handleSwitchChange('maintenanceMode', checked)}
              />
            </div>
             <div className="pt-4">
                <h3 className="text-lg font-medium text-primary">Logo & Favicon Management</h3>
                <p className="text-sm text-muted-foreground">
                  To update the site logo, replace the image file referenced in the Header component or integrate a dynamic URL.
                  For the favicon, ensure a file named <code>favicon.ico</code> exists in your <code>public</code> directory.
                </p>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save General Settings
            </Button>
          </CardFooter>
        </Card>

        <Card className="max-w-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Email (SMTP) Configuration</CardTitle>
            <CardDescription>Configure settings for sending emails (e.g., password resets).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive" className="bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-destructive/90">
                <strong>Security Warning:</strong> Storing SMTP credentials in the database is not recommended for production. 
                Use environment variables on your server for better security. These settings provide a fallback if environment variables are not set.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input id="smtpHost" name="smtpHost" value={settings.smtpHost || ''} onChange={handleInputChange} placeholder="e.g., smtp.example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input id="smtpPort" name="smtpPort" type="number" value={settings.smtpPort || ''} onChange={handleInputChange} placeholder="e.g., 587 or 465" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP User</Label>
                <Input id="smtpUser" name="smtpUser" value={settings.smtpUser || ''} onChange={handleInputChange} placeholder="Your SMTP username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPass">SMTP Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="smtpPass" 
                    name="smtpPass" 
                    type={showSmtpPassword ? "text" : "password"} 
                    value={currentSmtpPass} 
                    onChange={handleInputChange} 
                    placeholder="Enter new or existing password" 
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    aria-label={showSmtpPassword ? "Hide SMTP password" : "Show SMTP password"}
                  >
                    {showSmtpPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Leave blank to keep existing password unchanged (if one is set).</p>
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="emailFrom">"From" Email Address</Label>
                <Input id="emailFrom" name="emailFrom" type="email" value={settings.emailFrom || ''} onChange={handleInputChange} placeholder="e.g., no-reply@travelyatra.com" />
            </div>
             <div className="flex items-center space-x-2">
                <Switch
                    id="smtpSecure"
                    checked={settings.smtpSecure || false}
                    onCheckedChange={(checked) => handleSwitchChange('smtpSecure', checked)}
                />
                <Label htmlFor="smtpSecure" className="text-sm">
                    Use SSL/TLS (typically for port 465)
                </Label>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save All Settings
            </Button>
          </CardFooter>
        </Card>

      </form>
    </div>
  );
}
