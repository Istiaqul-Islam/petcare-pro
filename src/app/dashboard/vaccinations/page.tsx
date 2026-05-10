"use client";

export const runtime = "edge";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Syringe,
  Plus,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  User,
  FileText,
  Loader2,
  Bell,
  ChevronDown,
  Download,
  PawPrint,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  VACCINATION_TYPES,
  COMMON_VACCINES,
  VACCINATION_STATUS,
} from "@/lib/constants";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
}

interface Vaccination {
  id: string;
  petId: string;
  name: string;
  type: string | null;
  manufacturer: string | null;
  dateAdministered: string | null;
  nextDueDate: string | null;
  veterinarian: string | null;
  clinic: string | null;
  batchNumber: string | null;
  notes: string | null;
  status: string;
  reminderDays: number;
  createdAt: string;
  pet: Pet;
}

export default function VaccinationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPetId, setFilterPetId] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedVaccinationForReport, setSelectedVaccinationForReport] = useState<Vaccination | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [vaccinationsOffset, setVaccinationsOffset] = useState(0);
  const [totalVaccinations, setTotalVaccinations] = useState(0);
  const [loadingMoreVaccinations, setLoadingMoreVaccinations] = useState(false);
  const VACCINATIONS_LIMIT = 10;

  const [formData, setFormData] = useState({
    petId: "",
    name: "",
    type: "",
    manufacturer: "",
    dateAdministered: "",
    nextDueDate: "",
    veterinarian: "",
    clinic: "",
    batchNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vaccinationsRes, petsRes, userRes] = await Promise.all([
        fetch(`/api/vaccinations?limit=${VACCINATIONS_LIMIT}&offset=0`),
        fetch("/api/pets"),
        fetch("/api/user"),
      ]);

      if (vaccinationsRes.ok) {
        const data = (await vaccinationsRes.json()) as {
          vaccinations?: Vaccination[];
          total?: number;
        };
        setVaccinations((data.vaccinations || []) as any);
        setTotalVaccinations(data.total || 0);
        setVaccinationsOffset(0);
      }
      if (petsRes.ok) {
        const data = (await petsRes.json()) as { pets?: Pet[] };
        setPets((data.pets || []) as any);
      }
      if (userRes.ok) {
        const data = (await userRes.json()) as { user?: { name: string; email: string } };
        if (data.user) setCurrentUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreVaccinations = async () => {
    setLoadingMoreVaccinations(true);
    const nextOffset = vaccinationsOffset + VACCINATIONS_LIMIT;
    try {
      const res = await fetch(
        `/api/vaccinations?limit=${VACCINATIONS_LIMIT}&offset=${nextOffset}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { vaccinations?: Vaccination[] };
        setVaccinations((prev) => [...prev, ...(data.vaccinations || [])]);
        setVaccinationsOffset(nextOffset);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMoreVaccinations(false);
    }
  };

  useEffect(() => {
    if (vaccinations.length > 0) {
      gsap.fromTo(
        ".vaccination-card",
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          overwrite: "auto",
        }
      );
    }
  }, [vaccinations.length]);

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/vaccinations", {
        method: "POST",
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
          title: "Vaccination added",
          description: data.message,
        });
        setDialogOpen(false);
        fetchData();
        resetForm();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add vaccination",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toTitleCase = (str: string | null) => {
    if (!str) return "N/A";
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current || !selectedVaccinationForReport) return;

    try {
      // Pre-sanitize oklch colors
      const sanitize = (el: HTMLElement) => {
        const style = window.getComputedStyle(el);
        if (style.color.includes('oklch')) el.style.color = '#1e293b';
        if (style.backgroundColor.includes('oklch')) el.style.backgroundColor = 'transparent';
        if (style.borderColor.includes('oklch')) el.style.borderColor = '#e2e8f0';
        Array.from(el.children).forEach(child => sanitize(child as HTMLElement));
      };

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('[data-report="vaccination-report"]') as HTMLElement;
          if (element) {
            element.style.height = 'auto';
            element.style.overflow = 'visible';
            const all = element.getElementsByTagName('*');
            for (let i = 0; i < all.length; i++) {
              const el = all[i] as HTMLElement;
              const s = window.getComputedStyle(el);
              if (s.color.includes('oklch')) el.style.color = '#1e293b';
              if (s.backgroundColor.includes('oklch')) el.style.backgroundColor = 'transparent';
              if (s.borderColor.includes('oklch')) el.style.borderColor = '#e2e8f0';
            }
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Vaccination_${selectedVaccinationForReport.pet.name}_${selectedVaccinationForReport.name.replace(/\s+/g, '_')}.pdf`);

      toast({
        title: "Report Downloaded",
        description: "Clinical vaccination record has been saved.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Download Failed",
        description: "An error occurred. Chrome/Edge recommended.",
        variant: "destructive",
      });
    }
  };




  const resetForm = () => {
    setFormData({
      petId: "",
      name: "",
      type: "",
      manufacturer: "",
      dateAdministered: "",
      nextDueDate: "",
      veterinarian: "",
      clinic: "",
      batchNumber: "",
      notes: "",
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntilDue = (nextDueDate: string | null) => {
    if (!nextDueDate) return null;
    const due = new Date(nextDueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string, nextDueDate: string | null) => {
    const statusConfig = VACCINATION_STATUS.find((s) => s.value === status);
    const daysUntilDue = getDaysUntilDue(nextDueDate);

    let color = "bg-gray-100 text-gray-800";
    let icon = <Clock className="h-3 w-3" />;
    let label = statusConfig?.label || status;

    switch (status) {
      case "completed":
        color =
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        icon = <CheckCircle className="h-3 w-3" />;
        break;
      case "overdue":
        color = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        icon = <AlertTriangle className="h-3 w-3" />;
        break;
      case "scheduled":
        if (daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue > 0) {
          color =
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
          icon = <Bell className="h-3 w-3" />;
          label = `Due in ${daysUntilDue} days`;
        } else {
          color =
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
          icon = <Calendar className="h-3 w-3" />;
        }
        break;
    }

    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {icon}
        <span>{label}</span>
      </Badge>
    );
  };

  const filteredVaccinations = vaccinations.filter((vacc) => {
    const matchesSearch =
      vacc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vacc.pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vacc.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vacc.clinic?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPet = filterPetId === "all" || vacc.petId === filterPetId;

    return matchesSearch && matchesPet;
  });

  const upcomingVaccinations = filteredVaccinations.filter(
    (v) =>
      v.status === "scheduled" ||
      v.status === "overdue" ||
      (v.nextDueDate && new Date(v.nextDueDate) > new Date()),
  );

  const completedVaccinations = filteredVaccinations.filter(
    (v) =>
      v.status === "completed" &&
      (!v.nextDueDate || new Date(v.nextDueDate) <= new Date()),
  );

  // Get overdue count for notifications
  const overdueCount = vaccinations.filter(
    (v) => v.status === "overdue",
  ).length;
  const dueSoonCount = vaccinations.filter((v) => {
    const days = getDaysUntilDue(v.nextDueDate);
    return days !== null && days > 0 && days <= 7;
  }).length;

  // Comprehensive GSAP animations
  useEffect(() => {
    if (!loading) {
      // Header animations
      gsap.fromTo(
        ".vaccinations-header",
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      );

      gsap.fromTo(
        ".vaccinations-subtitle",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "power2.out" }
      );

      // Notification banner animations
      if (overdueCount > 0 || dueSoonCount > 0) {
        gsap.fromTo(
          ".notification-banner",
          { opacity: 0, y: -20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.4, ease: "back.out(1.7)" }
        );

        gsap.fromTo(
          ".notification-icon",
          { scale: 0, rotation: -180 },
          { scale: 1, rotation: 0, duration: 0.6, delay: 0.6, ease: "back.out(1.7)" }
        );
      }

      // Filter controls animations
      gsap.fromTo(
        ".filter-controls",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.6, ease: "power2.out" }
      );

      gsap.fromTo(
        ".search-input",
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, delay: 0.8, ease: "back.out(1.7)" }
      );

      gsap.fromTo(
        ".filter-select",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, delay: 1.0, ease: "power2.out" }
      );

      // Tabs animations
      gsap.fromTo(
        ".vaccinations-tabs",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 1.2, ease: "power2.out" }
      );

      gsap.fromTo(
        ".vaccination-tab-trigger",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "back.out(1.7)",
          delay: 1.4
        }
      );

      // Empty state animations
      if (vaccinations.length === 0) {
        gsap.fromTo(
          ".empty-vaccination-state",
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, delay: 1.6, ease: "power2.out" }
        );

        gsap.fromTo(
          ".empty-vaccination-icon",
          { scale: 0, rotation: -180 },
          { scale: 1, rotation: 0, duration: 0.8, delay: 1.8, ease: "back.out(1.7)" }
        );
      }

      // Interactive hover effects
      const vaccinationCards = document.querySelectorAll('.vaccination-card');
      vaccinationCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -8,
            scale: 1.02,
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            duration: 0.3,
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
        });
      });

      // Search input focus effect
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        searchInput.addEventListener('focus', () => {
          gsap.to('.filter-controls', {
            scale: 1.02,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        searchInput.addEventListener('blur', () => {
          gsap.to('.filter-controls', {
            scale: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      }

      // Filter select hover effect
      const filterSelect = document.querySelector('.filter-select');
      if (filterSelect) {
        filterSelect.addEventListener('mouseenter', () => {
          gsap.to(filterSelect, {
            scale: 1.05,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        filterSelect.addEventListener('mouseleave', () => {
          gsap.to(filterSelect, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      }

      // Tab hover effects
      const tabTriggers = document.querySelectorAll('.vaccination-tab-trigger');
      tabTriggers.forEach(tab => {
        tab.addEventListener('mouseenter', () => {
          gsap.to(tab, {
            scale: 1.05,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        tab.addEventListener('mouseleave', () => {
          gsap.to(tab, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      });

      return () => {
        gsap.killTweensOf(".vaccinations-header, .vaccinations-subtitle, .notification-banner, .notification-icon, .filter-controls, .search-input, .filter-select, .vaccinations-tabs, .vaccination-tab-trigger, .empty-vaccination-state, .empty-vaccination-icon, .vaccination-card");
      };
    }
  }, [loading, vaccinations.length, overdueCount, dueSoonCount]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold vaccinations-header">Vaccinations</h1>
          <p className="text-muted-foreground vaccinations-subtitle">
            Track and manage your pets&apos; vaccination records
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          disabled={pets.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      </div>

      {/* Notifications Banner */}
      {(overdueCount > 0 || dueSoonCount > 0) && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 notification-banner">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400 notification-icon" />
              <div className="flex-1">
                <div className="flex flex-wrap gap-3 text-sm">
                  {overdueCount > 0 && (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {overdueCount} vaccination{overdueCount > 1 ? "s" : ""}{" "}
                      overdue
                    </span>
                  )}
                  {dueSoonCount > 0 && (
                    <span className="text-yellow-700 dark:text-yellow-300">
                      {dueSoonCount} vaccination{dueSoonCount > 1 ? "s" : ""}{" "}
                      due within 7 days
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 filter-controls">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vaccinations..."
            className="pl-10 search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterPetId} onValueChange={setFilterPetId}>
          <SelectTrigger className="w-full sm:w-50 filter-select">
            <SelectValue placeholder="Filter by pet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pets</SelectItem>
            {pets.map((pet) => (
              <SelectItem key={pet.id} value={pet.id}>
                {pet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6 vaccinations-tabs">
        <TabsList>
          <TabsTrigger value="upcoming" className="vaccination-tab-trigger">
            Upcoming ({upcomingVaccinations.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="vaccination-tab-trigger">
            History ({completedVaccinations.length})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingVaccinations.length === 0 ? (
            <Card className="empty-vaccination-state">
              <CardContent className="py-12 text-center">
                <Syringe className="h-16 w-16 mx-auto text-muted-foreground mb-4 empty-vaccination-icon" />
                <h3 className="text-lg font-semibold mb-2">
                  No upcoming vaccinations
                </h3>
                <p className="text-muted-foreground mb-4">
                  {pets.length === 0
                    ? "Add a pet first to track vaccinations"
                    : "Add your first vaccination record"}
                </p>
                {pets.length > 0 && (
                  <Button
                    onClick={() => {
                      resetForm();
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vaccination
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingVaccinations.map((vacc) => (
                <Card
                  key={vacc.id}
                  className={`vaccination-card overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${
                    vacc.status === "overdue"
                      ? "border-red-200 dark:border-red-900"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedVaccinationForReport(vacc);
                    setReportDialogOpen(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Syringe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{vacc.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {vacc.pet.name} • {vacc.pet.species}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(vacc.status, vacc.nextDueDate)}
                      {vacc.type && (
                        <Badge variant="outline">{vacc.type}</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      {vacc.nextDueDate && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {formatDate(vacc.nextDueDate)}</span>
                        </div>
                      )}
                      {vacc.dateAdministered && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          <span>
                            Given: {formatDate(vacc.dateAdministered)}
                          </span>
                        </div>
                      )}
                      {vacc.manufacturer && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{vacc.manufacturer}</span>
                        </div>
                      )}
                      {vacc.veterinarian && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{vacc.veterinarian}</span>
                        </div>
                      )}
                    </div>

                    {vacc.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 line-clamp-2">
                        {vacc.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {completedVaccinations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No vaccination history
                </h3>
                <p className="text-muted-foreground">
                  Completed vaccinations will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedVaccinations.map((vacc) => (
                <Card 
                  key={vacc.id} 
                  className="vaccination-card opacity-75 cursor-pointer hover:opacity-100 transition-all hover:ring-2 hover:ring-primary/20"
                  onClick={() => {
                    setSelectedVaccinationForReport(vacc);
                    setReportDialogOpen(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Syringe className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{vacc.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {vacc.pet.name} • {vacc.pet.species}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                      {vacc.type && (
                        <Badge variant="outline">{vacc.type}</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      {vacc.dateAdministered && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(vacc.dateAdministered)}</span>
                        </div>
                      )}
                      {vacc.clinic && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{vacc.clinic}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {vaccinations.length < totalVaccinations && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMoreVaccinations}
            disabled={loadingMoreVaccinations}
          >
            {loadingMoreVaccinations ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Vaccinations"
            )}
          </Button>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Vaccination Record</DialogTitle>
            <DialogDescription>
              Record a new vaccination for your pet
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pet Selection */}
            <div className="space-y-2">
              <Label htmlFor="petId">Pet *</Label>
              <Select
                value={formData.petId}
                onValueChange={(value) => {
                  const pet = pets.find((p) => p.id === value);
                  setFormData({
                    ...formData,
                    petId: value,
                    // Auto-select a common vaccine based on species
                    name: pet
                      ? COMMON_VACCINES.find((v) =>
                          (v.species as readonly string[]).includes(
                            pet.species,
                          ),
                        )?.value || ""
                      : formData.name,
                  });
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your pet" />
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

            {/* Vaccine Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Vaccine Name *</Label>
              <Select
                value={formData.name}
                onValueChange={(value) =>
                  setFormData({ ...formData, name: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_VACCINES.map((vaccine) => (
                    <SelectItem key={vaccine.value} value={vaccine.value}>
                      {vaccine.label}
                      {vaccine.species.length > 0 && (
                        <span className="text-muted-foreground ml-2">
                          ({vaccine.species.join(", ")})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vaccine Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Vaccine Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VACCINATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manufacturer */}
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                placeholder="e.g., Pfizer, Zoetis"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateAdministered">Date Administered</Label>
                <Input
                  id="dateAdministered"
                  type="date"
                  value={formData.dateAdministered}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dateAdministered: e.target.value,
                    })
                  }
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Next Due Date</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, nextDueDate: e.target.value })
                  }
                  min={
                    formData.dateAdministered ||
                    new Date().toISOString().split("T")[0]
                  }
                />
              </div>
            </div>

            {/* Veterinarian */}
            <div className="space-y-2">
              <Label htmlFor="veterinarian">Veterinarian</Label>
              <Input
                id="veterinarian"
                value={formData.veterinarian}
                onChange={(e) =>
                  setFormData({ ...formData, veterinarian: e.target.value })
                }
                placeholder="Dr. Name"
              />
            </div>

            {/* Clinic */}
            <div className="space-y-2">
              <Label htmlFor="clinic">Clinic</Label>
              <Input
                id="clinic"
                value={formData.clinic}
                onChange={(e) =>
                  setFormData({ ...formData, clinic: e.target.value })
                }
                placeholder="Clinic or Hospital name"
              />
            </div>

            {/* Batch Number */}
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })
                }
                placeholder="Vaccine batch/lot number"
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
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Vaccination
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Report & Receipt Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col bg-slate-50 border-none shadow-2xl">
          <div className="sr-only">
            <DialogTitle>Vaccination Record for {selectedVaccinationForReport?.pet.name}</DialogTitle>
            <DialogDescription>Official veterinary vaccination documentation</DialogDescription>
          </div>

          <div className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Vaccination Record Report</h3>
              <p className="text-xs text-slate-500 font-medium">Official record for {selectedVaccinationForReport?.pet.name}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadReceipt} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md transition-all active:scale-95 px-4">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={() => setReportDialogOpen(false)} variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 transition-colors">
                <span className="sr-only">Close</span>
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/50">
            <div
              ref={receiptRef}
              data-report="vaccination-report"
              style={{
                padding: "30px",
                backgroundColor: "#ffffff",
                color: "#1e293b",
                fontFamily: "'Inter', system-ui, sans-serif",
                width: "100%",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: "1.5",
                boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
              }}
            >
              {/* Top Banner / Clinic Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "2px solid #0f172a", paddingBottom: "15px", backgroundColor: "#ffffff" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paw-print"><circle cx="11" cy="5" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="7" cy="9" r="2"/><circle cx="11" cy="21" r="2"/><path d="M4.27 14.7c-1.14 1.07-1.14 2.8 0 3.87 1.14 1.07 2.97 1.07 4.1 0 1.14-1.07 1.14-2.8 0-3.87-1.14-1.07-2.97-1.07-4.1 0Z"/><path d="M15.63 14.7c-1.14 1.07-1.14 2.8 0 3.87 1.14 1.07 2.97 1.07 4.1 0 1.14-1.07 1.14-2.8 0-3.87-1.14-1.07-2.97-1.07-4.1 0Z"/><path d="M10 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Z"/></svg>
                    <span style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "-0.5px", color: "#0f172a" }}>PETCARE PRO</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "0", fontWeight: "500" }}>VETERINARY CLINIC & CARE CENTER</p>
                  <p style={{ fontSize: "10px", color: "#94a3b8", margin: "2px 0 0 0" }}>www.petcare-pro.pages.dev | +1 (555) PET-CARE</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "16px", fontWeight: "900", color: "#3b82f6", margin: "0" }}>VACCINATION RECORD</p>
                  <p style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", fontWeight: "700" }}>REF: #{selectedVaccinationForReport?.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              {/* Patient & Client Meta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                <div>
                  <h5 style={{ fontSize: "9px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Patient Details</h5>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: "0" }}>{selectedVaccinationForReport?.pet.name} <span style={{ fontWeight: "400", color: "#64748b", fontSize: "11px" }}>({selectedVaccinationForReport?.pet.species})</span></p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>Breed: {selectedVaccinationForReport?.pet.breed || "N/A"}</p>
                </div>
                <div>
                  <h5 style={{ fontSize: "9px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Pet Owner Details</h5>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: "0" }}>{currentUser?.name || "Client"}</p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>{currentUser?.email || "N/A"}</p>
                </div>
              </div>

              {/* Rx / Vaccination Details */}
              <div style={{ marginBottom: "25px", backgroundColor: "#ffffff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", backgroundColor: "#ffffff" }}>
                  <span style={{ fontSize: "28px", fontWeight: "900", color: "#3b82f6", fontFamily: "serif" }}>Rx</span>
                  <div style={{ height: "1px", flex: 1, backgroundColor: "#e2e8f0" }}></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "30px", backgroundColor: "#ffffff" }}>
                  <div style={{ backgroundColor: "#ffffff" }}>
                    <div style={{ marginBottom: "12px", backgroundColor: "#ffffff" }}>
                      <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "800", textTransform: "uppercase", margin: "0" }}>Vaccine Name</p>
                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", margin: "4px 0 0 0" }}>{selectedVaccinationForReport?.name}</p>
                      <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>Type: {selectedVaccinationForReport?.type || "Standard"}</p>
                    </div>
                    <div style={{ backgroundColor: "#ffffff" }}>
                      <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "800", textTransform: "uppercase", margin: "0" }}>Administered Date</p>
                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", margin: "4px 0 0 0" }}>{formatDate(selectedVaccinationForReport?.dateAdministered || null)}</p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#ffffff" }}>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "800", textTransform: "uppercase", margin: "0" }}>Next Due Date</p>
                    <p style={{ fontSize: "14px", fontWeight: "800", color: "#3b82f6", marginTop: "6px" }}>
                      {formatDate(selectedVaccinationForReport?.nextDueDate || null)}
                    </p>
                    <p style={{ fontSize: "10px", color: "#64748b", fontStyle: "italic", marginTop: "4px" }}>Recommended follow-up date for continuous immunity.</p>
                  </div>
                </div>
              </div>

              {/* Provider & Manufacturing Info */}
              <div style={{ marginBottom: "30px", padding: "15px", border: "1px dashed #cbd5e1", borderRadius: "8px", backgroundColor: "#ffffff" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", backgroundColor: "#ffffff" }}>
                  <div style={{ backgroundColor: "#ffffff" }}>
                    <h5 style={{ fontSize: "10px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Medical Provider</h5>
                    <p style={{ fontSize: "12px", fontWeight: "700", color: "#334155", margin: "0" }}>{selectedVaccinationForReport?.veterinarian || "Certified Professional"}</p>
                    <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0 0" }}>{selectedVaccinationForReport?.clinic || "PetCare Partner Clinic"}</p>
                  </div>
                  <div style={{ backgroundColor: "#ffffff" }}>
                    <h5 style={{ fontSize: "10px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Batch Details</h5>
                    <p style={{ fontSize: "12px", color: "#334155", margin: "0" }}>Mfg: {selectedVaccinationForReport?.manufacturer || "N/A"}</p>
                    <p style={{ fontSize: "11px", fontFamily: "monospace", color: "#64748b", margin: "2px 0 0 0" }}>Batch: {selectedVaccinationForReport?.batchNumber || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Footer / Verification */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: "20px", borderTop: "1px solid #f1f5f9", backgroundColor: "#ffffff" }}>
                <div style={{ backgroundColor: "#ffffff" }}>
                  <div style={{ width: "180px", borderBottom: "1px solid #1e293b", marginBottom: "8px" }}></div>
                  <p style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b", margin: "0" }}>Clinical Authorization</p>
                  <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0 0" }}>Verified Vaccination Record</p>
                  <p style={{ fontSize: "9px", color: "#94a3b8", marginTop: "4px" }}>Digital Authorization ID: VAC-{selectedVaccinationForReport?.id.slice(-6).toUpperCase()}</p>
                </div>
                <div style={{ textAlign: "right", backgroundColor: "#ffffff" }}>
                  <div style={{ 
                    width: "80px", 
                    height: "80px", 
                    border: "2px solid #3b82f6", 
                    borderRadius: "50%", 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center",
                    opacity: "0.2",
                    transform: "rotate(-15deg)",
                    backgroundColor: "#ffffff"
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paw-print"><circle cx="11" cy="5" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="7" cy="9" r="2"/><circle cx="11" cy="21" r="2"/><path d="M4.27 14.7c-1.14 1.07-1.14 2.8 0 3.87 1.14 1.07 2.97 1.07 4.1 0 1.14-1.07 1.14-2.8 0-3.87-1.14-1.07-2.97-1.07-4.1 0Z"/><path d="M15.63 14.7c-1.14 1.07-1.14 2.8 0 3.87 1.14 1.07 2.97 1.07 4.1 0 1.14-1.07 1.14-2.8 0-3.87-1.14-1.07-2.97-1.07-4.1 0Z"/><path d="M10 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Z"/></svg>
                    <p style={{ fontSize: "8px", fontWeight: "900", color: "#3b82f6", margin: "2px 0 0 0" }}>CERTIFIED</p>
                  </div>
                  <p style={{ fontSize: "9px", color: "#94a3b8", marginTop: "10px" }}>Record Issued: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ marginTop: "20px", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "10px", backgroundColor: "#ffffff" }}>
                <p style={{ fontSize: "8px", color: "#cbd5e1", margin: "0" }}>This is a computer-generated vaccination record and does not require a physical signature for digital verification. PetCare Pro Platform.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
