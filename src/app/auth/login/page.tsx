"use client";

export const runtime = "edge";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PawPrint, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      // --- ADMIN BYPASS ---
      if (formData.email.toLowerCase() === "admin@petcare.com") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = (await response.json()) as { success?: boolean; user?: { role?: string }; error?: string };

        if (data.success) {
          toast({ title: "Admin Login Successful", description: "Welcome back, Admin." });
          router.push(data.user?.role === "admin" ? "/admin" : "/dashboard");
          router.refresh();
          return;
        } else {
          setLoading(false);
          toast({ title: "Admin Login Failed", description: data.error || "Invalid credentials", variant: "destructive" });
          return;
        }
      }

      // --- STANDARD USER (FIREBASE) ---
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // 2. Check if email is verified
      if (!user.emailVerified) {
        setLoading(false);
        toast({
          title: "Email not verified",
          description: (
            <div className="flex flex-col gap-2">
              <p>Please verify your email before logging in.</p>
              <Button size="sm" variant="outline" onClick={handleResendVerification}>
                Resend Verification Email
              </Button>
            </div>
          ),
          variant: "destructive",
        });
        return;
      }

      // 3. Get ID Token for server-side verification
      // Force refresh (true) to ensure the 'email_verified' claim is up to date
      const idToken = await user.getIdToken(true);

      // 4. Login to our Turso backend and create session
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          idToken: idToken,
        }),
      });

      const data = (await response.json()) as { success?: boolean; user?: { role?: string }; error?: string };

      if (data.success) {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });

        if (data.user?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      } else {
        toast({
          title: "Login failed",
          description: data.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let message = "Invalid email or password.";
      
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        message = "Invalid email or password.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later.";
      }

      toast({
        title: "Login Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PawPrint className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">PetCare Pro</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  disabled={loading}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    disabled={loading}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
