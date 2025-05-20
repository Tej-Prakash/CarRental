
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : undefined;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      toast({ title: "Invalid Token", description: "The password reset token is missing or invalid.", variant: "destructive"});
    }
  }, [token, toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    if (!password || !confirmPassword) {
      toast({ title: "Passwords Required", description: "Please enter and confirm your new password.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords Mismatch", description: "Your new passwords do not match.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
        toast({ title: "Password too short", description: "Password must be at least 6 characters long.", variant: "destructive" });
        setIsLoading(false); return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }
      
      setMessage(data.message); // "Your password has been successfully reset."
      toast({ title: "Password Reset Successful", description: data.message });
      // Optionally redirect to login after a short delay
      setTimeout(() => router.push('/login'), 3000);

    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (error && !message) { // Show error prominently if submit hasn't led to a success message
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] py-12 px-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle className="text-2xl font-bold text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild><Link href="/forgot-password">Request New Link</Link></Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] py-12 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold text-primary">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <p className="text-lg text-green-600">{message}</p>
              <p className="text-sm text-muted-foreground">You will be redirected to login shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                 <div className="relative">
                   <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                    id="password"
                    type="password"
                    placeholder="•••••••• (min. 6 characters)"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || !!message}
                    className="pl-10"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading || !!message}
                    className="pl-10"
                    />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !!message || !token}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                Reset Password
              </Button>
            </form>
          )}
          {error && <p className="mt-4 text-sm text-center text-destructive">{error}</p>}
        </CardContent>
         {!message && (
            <CardFooter className="flex justify-center text-sm">
                <Button variant="link" asChild className="p-0 h-auto text-accent" disabled={isLoading}>
                <Link href="/login">Back to Login</Link>
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
