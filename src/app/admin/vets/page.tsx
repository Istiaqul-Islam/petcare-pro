"use client";

export const runtime = "edge";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Stethoscope,
  Search,
  Star,
  Plus,
  Edit,
  Trash2,
  Camera,
  Loader2,
  Phone,
  Mail,
  MapPin,
  X,
  ExternalLink,
} from "lucide-react";
import { geocodeAddress } from "@/lib/geocoding";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface Vet {
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
}

const specializations = [
  "General Veterinary Medicine",
  "Veterinary Surgery",
  "Exotic Animal Medicine",
  "Veterinary Dentistry",
  "Emergency & Critical Care",
  "Veterinary Dermatology",
  "Veterinary Cardiology",
  "Small Animal Medicine",
  "Large Animal Medicine",
  "Veterinary Oncology",
  "Veterinary Neurology",
  "Veterinary Ophthalmology",
];

const ITEMS_PER_PAGE = 6;

export default function AdminVetsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [autoGeocoding, setAutoGeocoding] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [activePage, setActivePage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    clinic: "",
    address: "",
    phone: "",
    email: "",
    photo: "",
    qualification: "",
    experience: "",
    consultationFee: "",
    bio: "",
    latitude: "",
    longitude: "",
    isActive: true,
  });

  // Debounce hook for auto-geocoding
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  // Auto-geocoding when address changes
  const debouncedGeocode = useCallback(
    debounce(async (address: string) => {
      if (address.trim() && address.length > 5) {
        setAutoGeocoding(true);
        try {
          const result = await geocodeAddress(address);
          if (result) {
            setFormData(prev => ({
              ...prev,
              latitude: result.latitude.toString(),
              longitude: result.longitude.toString(),
            }));
          }
        } catch (error) {
          console.error('Auto-geocoding error:', error);
        } finally {
          setAutoGeocoding(false);
        }
      }
    }, 1500), // 1.5 second delay
    [debounce]
  );

  useEffect(() => {
    fetchVets();
  }, []);

  const fetchVets = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/vets");
      if (response.ok) {
        const data = (await response.json()) as { vets?: Vet[] };
        setVets(data.vets || []);
      }
    } catch (error) {
      console.error("Failed to fetch vets:", error);
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
        setFormData((prev) => ({ ...prev, photo: data.url }));
        toast({
          title: "Image uploaded",
          description: "Photo has been uploaded successfully",
        });
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = selectedVet ? `/api/vets/${selectedVet.id}` : "/api/vets";
      const method = selectedVet ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (data.success) {
        toast({
          title: selectedVet ? "Veterinarian updated" : "Veterinarian added",
          description: data.message,
        });
        setDialogOpen(false);
        fetchVets();
        resetForm();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save veterinarian",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVet) return;

    try {
      const response = await fetch(`/api/vets/${selectedVet.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (data.success) {
        toast({
          title: "Veterinarian removed",
          description: data.message,
        });
        setDeleteDialogOpen(false);
        fetchVets();
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete veterinarian",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (vet: Vet) => {
    setSelectedVet(vet);
    setFormData({
      name: vet.name,
      specialization: vet.specialization,
      clinic: vet.clinic,
      address: vet.address || "",
      phone: vet.phone || "",
      email: vet.email || "",
      photo: vet.photo || "",
      qualification: vet.qualification || "",
      experience: vet.experience?.toString() || "",
      consultationFee: vet.consultationFee?.toString() || "",
      bio: vet.bio || "",
      latitude: vet.latitude?.toString() || "",
      longitude: vet.longitude?.toString() || "",
      isActive: vet.isActive,
    });
    setDialogOpen(true);
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address.trim()) {
      toast({
        title: "Address required",
        description: "Please enter an address first",
        variant: "destructive",
      });
      return;
    }

    setGeocoding(true);
    try {
      const result = await geocodeAddress(formData.address);
      if (result) {
        setFormData(prev => ({
          ...prev,
          latitude: result.latitude.toString(),
          longitude: result.longitude.toString(),
        }));
        toast({
          title: "Location found",
          description: `Coordinates: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`,
        });
      } else {
        toast({
          title: "Location not found",
          description: "Could not find coordinates for this address. Please enter them manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch coordinates. Please try again or enter them manually.",
        variant: "destructive",
      });
    } finally {
      setGeocoding(false);
    }
  };

  const resetForm = () => {
    setSelectedVet(null);
    setFormData({
      name: "",
      specialization: "",
      clinic: "",
      address: "",
      phone: "",
      email: "",
      photo: "",
      qualification: "",
      experience: "",
      consultationFee: "",
      bio: "",
      latitude: "",
      longitude: "",
      isActive: true,
    });
  };

  const filteredVets = vets.filter((vet) =>
    vet.name.toLowerCase().includes(search.toLowerCase()) ||
    vet.specialization.toLowerCase().includes(search.toLowerCase()) ||
    vet.clinic.toLowerCase().includes(search.toLowerCase())
  );

  const allActiveVets = filteredVets.filter((v) => v.isActive);
  const allInactiveVets = filteredVets.filter((v) => !v.isActive);

  // Pagination logic for active vets
  const activeTotalPages = Math.ceil(allActiveVets.length / ITEMS_PER_PAGE);
  const activeStartIdx = (activePage - 1) * ITEMS_PER_PAGE;
  const activeVets = allActiveVets.slice(activeStartIdx, activeStartIdx + ITEMS_PER_PAGE);

  // Pagination logic for inactive vets
  const inactiveTotalPages = Math.ceil(allInactiveVets.length / ITEMS_PER_PAGE);
  const inactiveStartIdx = (inactivePage - 1) * ITEMS_PER_PAGE;
  const inactiveVets = allInactiveVets.slice(inactiveStartIdx, inactiveStartIdx + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Veterinarians</h1>
          <p className="text-muted-foreground">Manage veterinary partners</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Veterinarian
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search veterinarians..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({allActiveVets.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({allInactiveVets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </div>
          ) : activeVets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active veterinarians found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeVets.map((vet) => (
                <Card key={vet.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={vet.photo || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {vet.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{vet.name}</h3>
                        <p className="text-sm text-primary">{vet.specialization}</p>
                        <p className="text-sm text-muted-foreground truncate">{vet.clinic}</p>
                      </div>
                      <Badge>Active</Badge>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span>{vet.rating.toFixed(1)}</span>
                      </div>
                      {vet.experience && (
                        <span className="text-muted-foreground">
                          {vet.experience} yrs exp
                        </span>
                      )}
                      {vet.consultationFee && (
                        <span className="text-muted-foreground">
                          ${vet.consultationFee}/visit
                        </span>
                      )}
                    </div>

                    {vet.phone && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {vet.phone}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(vet)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => {
                          setSelectedVet(vet);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {/* Pagination Controls for Active */}
          {activeTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivePage(Math.max(1, activePage - 1))}
                disabled={activePage === 1}
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: activeTotalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={activePage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActivePage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivePage(Math.min(activeTotalPages, activePage + 1))}
                disabled={activePage === activeTotalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          {inactiveVets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No inactive veterinarians</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactiveVets.map((vet) => (
                <Card key={vet.id} className="overflow-hidden opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={vet.photo || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                          {vet.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{vet.name}</h3>
                        <p className="text-sm text-muted-foreground">{vet.specialization}</p>
                      </div>
                      <Badge variant="secondary">Inactive</Badge>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(vet)}
                      >
                        Reactivate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {/* Pagination Controls for Inactive */}
          {inactiveTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInactivePage(Math.max(1, inactivePage - 1))}
                disabled={inactivePage === 1}
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: inactiveTotalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={inactivePage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInactivePage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInactivePage(Math.min(inactiveTotalPages, inactivePage + 1))}
                disabled={inactivePage === inactiveTotalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedVet ? "Edit Veterinarian" : "Add Veterinarian"}</DialogTitle>
            <DialogDescription>
              {selectedVet ? "Update veterinarian information" : "Add a new veterinary partner"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo */}
            <div className="flex justify-center">
              <div
                className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.photo ? (
                  <img src={formData.photo} alt="Vet" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-muted-foreground" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) =>
                    setFormData({ ...formData, specialization: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic">Clinic *</Label>
                <Input
                  id="clinic"
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      debouncedGeocode(e.target.value);
                    }}
                    placeholder="Street address for map location"
                  />
                  {autoGeocoding && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Type an address and coordinates will be auto-filled for precise map location
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Location Coordinates</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeocodeAddress}
                  disabled={!formData.address.trim() || geocoding}
                  className="text-xs"
                >
                  {geocoding ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Finding...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3 mr-1" />
                      Get from Address
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g., 40.7128"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g., -74.0060"
                  />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Enter coordinates manually or use "Get from Address" to auto-fill. These are used for the interactive map on the veterinarian profile.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g., DVM, MS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years)</Label>
                <Input
                  id="experience"
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultationFee">Consultation Fee ($)</Label>
                <Input
                  id="consultationFee"
                  type="number"
                  step="0.01"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                />
              </div>
              <div className="space-y-2 flex items-center gap-2 pt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                placeholder="Brief description..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedVet ? "Update" : "Add Veterinarian"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Veterinarian</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedVet?.name}? This will deactivate their profile.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
