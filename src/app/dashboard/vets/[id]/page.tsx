"use client";

export const runtime = "edge";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  Star,
  Calendar,
  Clock,
  Award,
  DollarSign,
  ExternalLink,
  ArrowLeft,
  Share2,
  Heart,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { GoogleMap } from "@/components/ui/map";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { APPOINTMENT_TYPES } from "@/lib/constants";

interface Pet {
  id: string;
  name: string;
  species: string;
}

interface Veterinarian {
  id: string;
  name: string;
  specialization: string;
  clinic: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  photo: string | null;
  qualification: string | null;
  experience: number | null;
  rating: number;
  reviewCount: number;
  consultationFee: number | null;
  availability: string | null;
  bio: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function VetProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [vet, setVet] = useState<Veterinarian | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    petId: "",
    date: "",
    time: "",
    type: "consultation",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchVet(params.id as string);
    }
    fetchPets();
  }, [params.id]);

  const fetchVet = async (id: string) => {
    try {
      const response = await fetch(`/api/vets/${id}`);
      if (response.ok) {
        const data = (await response.json()) as {
          success?: boolean;
          vet?: Veterinarian;
          error?: string;
        };
        if (data.success && data.vet) {
          setVet(data.vet);
        } else {
          throw new Error(data.error || "Veterinarian not found");
        }
      } else {
        throw new Error("Failed to fetch veterinarian");
      }
    } catch (error) {
      console.error("Error fetching vet:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load veterinarian profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = async () => {
    if (navigator.share && vet) {
      try {
        await navigator.share({
          title: `Dr. ${vet.name} - ${vet.specialization}`,
          text: `Check out Dr. ${vet.name}, ${vet.specialization} at ${vet.clinic}`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Profile link copied to clipboard",
        });
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Profile link copied to clipboard",
      });
    }
  };

  const fetchPets = async () => {
    try {
      const response = await fetch("/api/pets");
      if (response.ok) {
        const data = (await response.json()) as { pets?: Pet[] };
        setPets(data.pets || []);
      }
    } catch (error) {
      console.error("Failed to fetch pets:", error);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vet) return;

    setSaving(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          vetId: vet.id,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };
      if (data.success) {
        toast({
          title: "Appointment booked",
          description: data.message,
        });
        setBookingDialogOpen(false);
        resetForm();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to book appointment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      petId: "",
      date: "",
      time: "",
      type: "consultation",
      reason: "",
      notes: "",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Skeleton className="h-64" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!vet) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Veterinarian Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Stethoscope className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Profile not available
            </h3>
            <p className="text-muted-foreground mb-4">
              The veterinarian profile you're looking for doesn't exist or has
              been deactivated.
            </p>
            <Button onClick={() => router.push("/dashboard/appointments")}>
              Find Other Veterinarians
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Dr. {vet.name}</h1>
            <p className="text-muted-foreground">{vet.specialization}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleShareProfile}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={vet.photo || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {vet.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">Dr. {vet.name}</h2>
                  <p className="text-primary">{vet.specialization}</p>
                  <p className="text-muted-foreground">{vet.clinic}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{vet.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({vet.reviewCount} reviews)
                  </span>
                </div>

                {vet.experience && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {vet.experience} years experience
                  </div>
                )}

                {vet.consultationFee && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">${vet.consultationFee}</span>
                    <span className="text-muted-foreground">consultation</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => setBookingDialogOpen(true)}
                disabled={pets.length === 0}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {pets.length === 0 ? "Add a pet first" : "Book Appointment"}
              </Button>
              {vet.phone && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`tel:${vet.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Clinic
                  </a>
                </Button>
              )}
              {vet.email && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${vet.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {vet.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {vet.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {vet.phone && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {vet.phone}
                      </p>
                    </div>
                  </div>
                )}
                {vet.email && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {vet.email}
                      </p>
                    </div>
                  </div>
                )}
                {vet.address && (
                  <div className="flex items-center gap-3 md:col-span-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {vet.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Qualifications */}
          {vet.qualification && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{vet.qualification}</p>
              </CardContent>
            </Card>
          )}

          {/* Availability */}
          {vet.availability && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {vet.availability}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Location Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Clinic Location
              </CardTitle>
              <CardDescription>
                Find {vet.clinic} on the map and get directions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleMap
                address={vet.address}
                latitude={vet.latitude}
                longitude={vet.longitude}
                locationName={vet.clinic}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Schedule an appointment with {vet?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookAppointment} className="space-y-4">
            {/* Pet */}
            <div className="space-y-2">
              <Label htmlFor="petId">Select Pet *</Label>
              <Select
                value={formData.petId}
                onValueChange={(value) =>
                  setFormData({ ...formData, petId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose your pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Appointment Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Describe your pet's symptoms or reason for visit..."
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional information..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBookingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Book Appointment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
