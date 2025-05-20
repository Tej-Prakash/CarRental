
"use client"

import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, save settings to backend
    toast({
      title: "Settings Saved (Demo)",
      description: "Your settings have been updated (this is a demo).",
    });
  };

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
              <Label htmlFor="appName">Application Name</Label>
              <Input id="appName" defaultValue="Wheels on Clicks" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Default Admin Email</Label>
              <Input id="adminEmail" type="email" defaultValue="admin@wheelsonclicks.com" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode" className="text-base">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access to the public site.
                </p>
              </div>
              <Switch id="maintenanceMode" aria-label="Toggle maintenance mode" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Input id="currency" defaultValue="USD" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Save Settings</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
