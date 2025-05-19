"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Mail, KeyRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    // Mock login
    console.log("Login attempt:", { email, password });
    toast({
      title: "Login Submitted (Demo)",
      description: "Login functionality is for demonstration purposes.",
    });
    // In a real app, you'd call an auth API here.
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold text-primary">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue your journey with Wheels on Clicks.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-right">
                <Button variant="link" size="sm" asChild className="p-0 h-auto text-accent">
                  <Link href="#">Forgot password?</Link>
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 text-sm">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto text-accent">
              <Link href="/signup">Sign up here</Link>
            </Button>
          </p>
           <p className="text-muted-foreground text-xs pt-2">
            (Social login options can be added here)
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
