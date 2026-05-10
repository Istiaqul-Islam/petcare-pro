"use client";

export const runtime = "edge";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { sendEmailVerification, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function VerificationPendingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification email.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      // Force refresh the Firebase user to get latest verification status
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        // If verified in Firebase, we need to refresh the session
        const idToken = await auth.currentUser.getIdToken(true);
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: auth.currentUser.email,
            idToken,
            confirmVerification: true
          }),
        });

        if (response.ok) {
          toast({ title: "Success", description: "Email verified! Taking you to dashboard." });
          router.push("/dashboard");
          router.refresh();
        } else {
          toast({ title: "Wait", description: "Firebase is verified, but session sync failed. Try logging in again." });
        }
      } else {
        toast({ title: "Still Pending", description: "Please click the link in your email first." });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-primary animate-bounce" />
          </div>
          <CardTitle className="text-2xl">Verify your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to your inbox. Please click it to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground border">
            <p>If you don't see the email, check your spam folder.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleCheckStatus} 
              className="w-full" 
              disabled={checking}
            >
              {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              I've Clicked the Link
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleResendEmail} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Resend Verification Email"}
            </Button>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
