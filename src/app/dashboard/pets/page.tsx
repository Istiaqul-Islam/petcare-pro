"use client";

export const runtime = "edge";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  PawPrint,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Camera,
  X,
  Loader2,
  Dog,
  Cat,
  Bird,
  Fish,
  Rabbit,
  Heart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PET_SPECIES, PET_GENDERS } from "@/lib/constants";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birthDate: string | null;
  weight: number | null;
  color: string | null;
  photo: string | null;
  notes: string | null;
  isActive: boolean;
}

const getSpeciesIcon = (species: string) => {
  const icons: Record<string, typeof PawPrint> = {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    fish: Fish,
    rabbit: Rabbit,
  };
  return icons[species.toLowerCase()] || PawPrint;
};

export default function PetsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [petsOffset, setPetsOffset] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [loadingMorePets, setLoadingMorePets] = useState(false);
  const PETS_LIMIT = 10;
  const [formData, setFormData] = useState({
    name: "",
    species: "dog",
    breed: "",
    gender: "",
    birthDate: "",
    weight: "",
    color: "",
    photo: "",
    notes: "",
  });

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const response = await fetch(`/api/pets?limit=${PETS_LIMIT}&offset=0`);
      if (response.ok) {
        const data = (await response.json()) as {
          pets?: Pet[];
          total?: number;
        };
        setPets(data.pets || []);
        setTotalPets(data.total || 0);
        setPetsOffset(0);
      }
    } catch (error) {
      console.error("Failed to fetch pets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      // Header animations
      gsap.fromTo(
        ".page-title",
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      );

      gsap.fromTo(
        ".page-subtitle",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "power2.out" }
      );

      gsap.fromTo(
        ".add-pet-btn",
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6, delay: 0.4, ease: "back.out(1.7)" }
      );

      // Search animations
      gsap.fromTo(
        ".search-container",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.6, ease: "power2.out" }
      );

      gsap.fromTo(
        ".search-icon",
        { scale: 0, rotation: -90 },
        { scale: 1, rotation: 0, duration: 0.6, delay: 0.8, ease: "back.out(1.7)" }
      );

      // Pet cards animations
      if (pets.length > 0) {
        gsap.fromTo(
          ".pet-card",
          { opacity: 0, y: 40, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "back.out(1.7)",
            delay: 1.0,
            overwrite: "auto",
          }
        );

        gsap.fromTo(
          ".pet-photo",
          { scale: 1.1, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power2.out",
            delay: 1.2,
          }
        );

        gsap.fromTo(
          ".pet-placeholder",
          { scale: 0, rotation: -180 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.7)",
            delay: 1.4,
          }
        );
      } else {
        // Empty state animations
        gsap.fromTo(
          ".empty-state-card",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7, delay: 1.0, ease: "power2.out" }
        );

        gsap.fromTo(
          ".empty-state-icon",
          { scale: 0, rotation: -180 },
          { scale: 1, rotation: 0, duration: 0.8, delay: 1.2, ease: "back.out(1.7)" }
        );

        gsap.fromTo(
          ".empty-state-title",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, delay: 1.4, ease: "power2.out" }
        );

        gsap.fromTo(
          ".empty-state-description",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, delay: 1.6, ease: "power2.out" }
        );

        gsap.fromTo(
          ".add-first-pet-btn",
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.6, delay: 1.8, ease: "back.out(1.7)" }
        );
      }

      // Interactive hover effects
      const petCards = document.querySelectorAll('.pet-card');
      petCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -8,
            scale: 1.02,
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            duration: 0.3,
            ease: "power2.out"
          });
          
          gsap.to('.pet-menu-btn', {
            opacity: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            duration: 0.3,
            ease: "power2.out"
          });
          
          gsap.to('.pet-menu-btn', {
            opacity: 0,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      });

      // Search input focus effect
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        searchInput.addEventListener('focus', () => {
          gsap.to('.search-container', {
            scale: 1.02,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        searchInput.addEventListener('blur', () => {
          gsap.to('.search-container', {
            scale: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      }

      return () => {
        gsap.killTweensOf(".page-title, .page-subtitle, .add-pet-btn, .search-container, .search-icon, .pet-card, .pet-photo, .pet-placeholder, .empty-state-card, .empty-state-icon, .empty-state-title, .empty-state-description, .add-first-pet-btn, .pet-menu-btn");
      };
    }
  }, [loading, pets.length]);

  const loadMorePets = async () => {
    setLoadingMorePets(true);
    const nextOffset = petsOffset + PETS_LIMIT;
    try {
      const res = await fetch(
        `/api/pets?limit=${PETS_LIMIT}&offset=${nextOffset}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { pets?: Pet[] };
        setPets((prev) => [...prev, ...(data.pets || [])]);
        setPetsOffset(nextOffset);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMorePets(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };
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
      const url = selectedPet ? `/api/pets/${selectedPet.id}` : "/api/pets";
      const method = selectedPet ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };
      if (data.success) {
        toast({
          title: selectedPet ? "Pet updated" : "Pet added",
          description: data.message,
        });
        setDialogOpen(false);
        fetchPets();
        resetForm();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save pet",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPet) return;

    try {
      const response = await fetch(`/api/pets/${selectedPet.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };
      if (data.success) {
        toast({
          title: "Pet removed",
          description: data.message,
        });
        setDeleteDialogOpen(false);
        fetchPets();
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete pet",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (pet: Pet) => {
    setSelectedPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      gender: pet.gender || "",
      birthDate: pet.birthDate ? pet.birthDate.split("T")[0] : "",
      weight: pet.weight?.toString() || "",
      color: pet.color || "",
      photo: pet.photo || "",
      notes: pet.notes || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedPet(null);
    setFormData({
      name: "",
      species: "dog",
      breed: "",
      gender: "",
      birthDate: "",
      weight: "",
      color: "",
      photo: "",
      notes: "",
    });
  };

  const filteredPets = pets.filter(
    (pet) =>
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();

    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""} old`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? "s" : ""} old`;
    }
    return "Less than a month old";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pets-header">
        <div>
          <h1 className="text-3xl font-bold page-title">My Pets</h1>
          <p className="text-muted-foreground page-subtitle">Manage your furry friends</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="add-pet-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Pet
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md search-container">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground search-icon" />
        <Input
          placeholder="Search pets..."
          className="pl-10 search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Pets Grid */}
      {filteredPets.length === 0 ? (
        <Card className="empty-state-card">
          <CardContent className="py-12 text-center">
            <PawPrint className="h-16 w-16 mx-auto text-muted-foreground mb-4 empty-state-icon" />
            <h3 className="text-lg font-semibold mb-2 empty-state-title">
              {searchQuery ? "No pets found" : "No pets yet"}
            </h3>
            <p className="text-muted-foreground mb-4 empty-state-description">
              {searchQuery
                ? "Try a different search term"
                : "Start by adding your first pet"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
                className="add-first-pet-btn"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Pet
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPets.map((pet) => {
            const SpeciesIcon = getSpeciesIcon(pet.species);
            return (
              <Card key={pet.id} className="pet-card group overflow-hidden">
                {/* Photo */}
                <div className="aspect-4/3 relative bg-muted pet-photo-container">
                  {pet.photo ? (
                    <img
                      src={pet.photo}
                      alt={pet.name}
                      className="w-full h-full object-cover pet-photo"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center pet-placeholder">
                      <SpeciesIcon className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 pet-actions">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity pet-menu-btn"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(pet)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedPet(pet);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Info */}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{pet.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pet.breed || pet.species}
                      </p>
                    </div>
                    {pet.gender && (
                      <Badge variant="secondary">
                        {pet.gender === "male" ? "♂" : "♀"}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    {pet.birthDate && <p>{getAge(pet.birthDate)}</p>}
                    {pet.weight && <p>{pet.weight} kg</p>}
                    {pet.color && <p>{pet.color}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pets.length < totalPets && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMorePets}
            disabled={loadingMorePets}
          >
            {loadingMorePets ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Pets"
            )}
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPet ? "Edit Pet" : "Add New Pet"}
            </DialogTitle>
            <DialogDescription>
              {selectedPet
                ? "Update your pet's information"
                : "Fill in the details about your pet"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo */}
            <div className="flex justify-center">
              <div
                className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    alt="Pet"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
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
            <p className="text-xs text-center text-muted-foreground">
              Click to upload photo
            </p>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Species */}
            <div className="space-y-2">
              <Label htmlFor="species">Species *</Label>
              <Select
                value={formData.species}
                onValueChange={(value) =>
                  setFormData({ ...formData, species: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PET_SPECIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.icon} {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) =>
                  setFormData({ ...formData, breed: e.target.value })
                }
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {PET_GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedPet ? "Update" : "Add Pet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pet</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedPet?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
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
