"use client";

export const runtime = "edge";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Camera,
  Loader2,
  Save,
  Calendar,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { 
  PawPrint,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  address: string | null;
  phone: string | null;
  role: string;
  showPets: number;
  showEmail: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    avatar: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchUser();
  }, []);

  // GSAP animations
  useEffect(() => {
    if (!loading && user) {
      // Header animations
      gsap.fromTo(
        ".profile-header",
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      );

      gsap.fromTo(
        ".profile-subtitle",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "power2.out" }
      );

      // Profile photo card animations
      gsap.fromTo(
        ".profile-photo-card",
        { opacity: 0, x: -50, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.7, delay: 0.4, ease: "back.out(1.7)" }
      );

      gsap.fromTo(
        ".profile-avatar",
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.8, delay: 0.6, ease: "back.out(1.7)" }
      );

      gsap.fromTo(
        ".profile-photo-text",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.8, ease: "power2.out" }
      );

      // Personal information card animations
      gsap.fromTo(
        ".personal-info-card",
        { opacity: 0, x: 50, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.7, delay: 0.5, ease: "back.out(1.7)" }
      );

      // Form field animations
      gsap.fromTo(
        ".form-field",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          delay: 0.7
        }
      );

      // Security section animations
      gsap.fromTo(
        ".security-card",
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.9, ease: "power2.out" }
      );

      // Account information section animations
      gsap.fromTo(
        ".account-info-card",
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 1.1, ease: "power2.out" }
      );

      gsap.fromTo(
        ".account-info-item",
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          delay: 1.3
        }
      );

      // Interactive hover effects
      const profileCard = document.querySelector('.profile-photo-card');
      if (profileCard) {
        profileCard.addEventListener('mouseenter', () => {
          gsap.to(profileCard, {
            y: -5,
            scale: 1.02,
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        profileCard.addEventListener('mouseleave', () => {
          gsap.to(profileCard, {
            y: 0,
            scale: 1,
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            duration: 0.3,
            ease: "power2.out"
          });
        });
      }

      const personalInfoCard = document.querySelector('.personal-info-card');
      if (personalInfoCard) {
        personalInfoCard.addEventListener('mouseenter', () => {
          gsap.to(personalInfoCard, {
            y: -3,
            scale: 1.01,
            boxShadow: "0 15px 30px rgba(0,0,0,0.08)",
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        personalInfoCard.addEventListener('mouseleave', () => {
          gsap.to(personalInfoCard, {
            y: 0,
            scale: 1,
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            duration: 0.3,
            ease: "power2.out"
          });
        });
      }

      // Form input focus effects
      const formInputs = document.querySelectorAll('.form-field input');
      formInputs.forEach(input => {
        const parent = input.closest('.form-field');
        if (parent) {
          input.addEventListener('focus', () => {
            gsap.to(parent, {
              scale: 1.02,
              duration: 0.2,
              ease: "power2.out"
            });
          });
          
          input.addEventListener('blur', () => {
            gsap.to(parent, {
              scale: 1,
              duration: 0.2,
              ease: "power2.out"
            });
          });
        }
      });

      // Save button hover effect
      const saveButton = document.querySelector('.save-profile-btn');
      if (saveButton) {
        saveButton.addEventListener('mouseenter', () => {
          gsap.to(saveButton, {
            scale: 1.05,
            y: -2,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        saveButton.addEventListener('mouseleave', () => {
          gsap.to(saveButton, {
            scale: 1,
            y: 0,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      }

      return () => {
        gsap.killTweensOf(".profile-header, .profile-subtitle, .profile-photo-card, .profile-avatar, .profile-photo-text, .personal-info-card, .form-field, .security-card, .account-info-card, .account-info-item, .save-profile-btn");
      };
    }
  }, [loading, user]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = (await response.json()) as { user?: Partial<UserProfile> };
        if (data.user) {
          setUser(data.user as UserProfile);
          setFormData({
            name: data.user.name || "",
            phone: data.user.phone || "",
            address: data.user.address || "",
            avatar: data.user.avatar || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = (await response.json()) as { success?: boolean; url?: string; error?: string };
      if (data.success) {
        setFormData((prev) => ({ ...prev, avatar: data.url }));
        // Automatically save the avatar
        await saveProfile({ ...formData, avatar: data.url });
        toast({
          title: "Photo updated",
          description: "Your profile photo has been updated successfully",
        });
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (data: typeof formData) => {
    const response = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await saveProfile(formData);
      const data = (await response.json()) as { success?: boolean; user?: Partial<UserProfile>; error?: string };

      if (data.success && data.user) {
        setUser(data.user as UserProfile);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePrivacy = async (checked: boolean) => {
    try {
       const response = await fetch("/api/user", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ showPets: checked ? 1 : 0 }),
       });
       if (response.ok) {
         setUser(prev => prev ? { ...prev, showPets: checked ? 1 : 0 } : null);
         toast({ title: "Privacy Updated", description: `Pet list is now ${checked ? 'public' : 'private'}.` });
       }
    } catch (e) {}
  }

  const handleToggleEmailPrivacy = async (checked: boolean) => {
    try {
       const response = await fetch("/api/user", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ showEmail: checked ? 1 : 0 }),
       });
       if (response.ok) {
         setUser(prev => prev ? { ...prev, showEmail: checked ? 1 : 0 } : null);
         toast({ title: "Privacy Updated", description: `Email is now ${checked ? 'public' : 'private'}.` });
       }
    } catch (e) {}
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (data.success) {
        toast({
          title: "Password changed",
          description: "Your password has been changed successfully",
        });
        setPasswordDialogOpen(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold profile-header">Profile Settings</h1>
        <p className="text-muted-foreground profile-subtitle">Manage your account information and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Photo Card */}
        <Card className="lg:col-span-1 profile-photo-card">
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
            <CardDescription>Upload a photo to personalize your account</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div
              className="relative w-32 h-32 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden group"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="w-32 h-32 profile-avatar">
                <AvatarImage src={formData.avatar || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {getInitials(user?.name || null)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <p className="text-sm text-muted-foreground mt-4 profile-photo-text animate-pulse">
              Click to change photo
            </p>
            <p className="text-xs text-muted-foreground mt-1 profile-photo-text animate-pulse">
              JPG, PNG or GIF. Max 5MB.
            </p>
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <Card className="lg:col-span-2 personal-info-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2 form-field">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2 form-field">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2 form-field">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Address */}
              <div className="space-y-2 form-field">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your address"
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full sm:w-auto save-profile-btn">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Security Section */}
      <Card className="security-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your password and account security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Change your password to keep your account secure
              </p>
            </div>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="account-info-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your account details and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 account-info-item">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Account Role</p>
                  <p className="text-sm text-muted-foreground">Your permission level</p>
                </div>
              </div>
              <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
                {user?.role === "admin" ? "Administrator" : "User"}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between py-3 account-info-item">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">When you joined</p>
                </div>
              </div>
              <span className="text-sm font-medium">
                {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between py-3 account-info-item">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <PawPrint className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Public Pet List</p>
                  <p className="text-sm text-muted-foreground">Show your pets on your public profile</p>
                </div>
              </div>
              <Switch 
                checked={user?.showPets === 1}
                onCheckedChange={handleTogglePrivacy}
              />
            </div>

            <div className="flex items-center justify-between py-3 account-info-item">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Public Email</p>
                  <p className="text-sm text-muted-foreground">Show email address on your public profile</p>
                </div>
              </div>
              <Switch 
                checked={user?.showEmail === 1}
                onCheckedChange={handleToggleEmailPrivacy}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between py-3 account-info-item">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Save className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">When your profile was last modified</p>
                </div>
              </div>
              <span className="text-sm font-medium">
                {user?.updatedAt ? formatDate(user.updatedAt) : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder="Enter new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
