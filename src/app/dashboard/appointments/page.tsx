"use client";

export const runtime = "edge";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  FileText,
  User as UserIcon,
  Building2,
  PawPrint
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  reason: string | null;
  type: string;
  status: string;
  notes: string | null;
  vet: Veterinarian;
  pet: Pet;
}

const VETS_PER_PAGE = 6;
const APPOINTMENTS_LIMIT = 10;

export default function AppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);
  const [saving, setSaving] = useState(false);
  const [vetsPage, setVetsPage] = useState(1);

  const [appointmentsOffset, setAppointmentsOffset] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [loadingMoreAppointments, setLoadingMoreAppointments] = useState(false);

  const [formData, setFormData] = useState({
    petId: "",
    date: "",
    time: "",
    type: "consultation",
    reason: "",
    notes: "",
  });

  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vetsRes, appointmentsRes, petsRes] = await Promise.all([
        fetch("/api/vets?limit=50"),
        fetch(`/api/appointments?limit=${APPOINTMENTS_LIMIT}&offset=0`),
        fetch("/api/pets"),
      ]);

      if (vetsRes.ok) {
        const vetsData = (await vetsRes.json()) as { vets?: Veterinarian[] };
        setVets(vetsData.vets || []);
      }
      if (appointmentsRes.ok) {
        const appointmentsData = (await appointmentsRes.json()) as { appointments?: Appointment[], total?: number };
        setAppointments(appointmentsData.appointments || []);
        setTotalAppointments(appointmentsData.total || 0);
        setAppointmentsOffset(0);
      }
      if (petsRes.ok) {
        const petsData = (await petsRes.json()) as { pets?: Pet[] };
        setPets(petsData.pets || []);
      }
      const userRes = await fetch("/api/user");
      if (userRes.ok) {
        const data = await userRes.json();
        if (data.user) setCurrentUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreAppointments = async () => {
    setLoadingMoreAppointments(true);
    const nextOffset = appointmentsOffset + APPOINTMENTS_LIMIT;
    try {
      const res = await fetch(`/api/appointments?limit=${APPOINTMENTS_LIMIT}&offset=${nextOffset}`);
      if (res.ok) {
        const data = (await res.json()) as { appointments?: Appointment[] };
        setAppointments((prev) => [...prev, ...(data.appointments || [])]);
        setAppointmentsOffset(nextOffset);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMoreAppointments(false);
    }
  };

  useEffect(() => {
    const cards = document.querySelectorAll('.appointment-card');
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
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
  }, [appointments.length]);

  // Comprehensive GSAP animations
  useEffect(() => {
    if (!loading) {
      // Header animations
      gsap.fromTo(
        ".appointments-header",
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      );

      const cards = document.querySelectorAll('.appointment-card');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out", delay: 0.2 }
        );
      }

      // Tabs animations
      gsap.fromTo(
        ".tabs-container",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: "power2.out" }
      );

      gsap.fromTo(
        ".tab-trigger",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "back.out(1.7)",
          delay: 0.6
        }
      );

      // Search animations
      gsap.fromTo(
        ".search-container",
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.8, ease: "power2.out" }
      );

      gsap.fromTo(
        ".search-icon",
        { scale: 0, rotation: -90 },
        { scale: 1, rotation: 0, duration: 0.6, delay: 1.0, ease: "back.out(1.7)" }
      );

      // Vet cards animations
      if (vets.length > 0) {
        gsap.fromTo(
          ".vet-card",
          { opacity: 0, y: 40, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "back.out(1.7)",
            delay: 1.2,
            overwrite: "auto"
          }
        );

        gsap.fromTo(
          ".vet-avatar",
          { scale: 0, rotation: -180 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.7)",
            delay: 1.4,
            overwrite: "auto"
          }
        );

        gsap.fromTo(
          ".vet-rating",
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
            delay: 1.6,
            overwrite: "auto"
          }
        );
      }

      // Empty state animations
      if (vets.length === 0) {
        gsap.fromTo(
          ".empty-vets-state",
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, delay: 1.2, ease: "power2.out" }
        );

        gsap.fromTo(
          ".empty-vets-icon",
          { scale: 0, rotation: -180 },
          { scale: 1, rotation: 0, duration: 0.8, delay: 1.4, ease: "back.out(1.7)" }
        );
      }

      // Interactive hover effects
      const vetCards = document.querySelectorAll('.vet-card');
      vetCards.forEach(card => {
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

      cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -5,
            scale: 1.01,
            boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
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

      // Tab hover effects
      const tabTriggers = document.querySelectorAll('.tab-trigger');
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
        const targets = ".appointments-header, .appointments-subtitle, .tabs-container, .tab-trigger, .search-container, .search-icon, .vet-card, .vet-avatar, .vet-rating, .empty-vets-state, .empty-vets-icon, .appointment-card";
        const validTargets = targets.split(", ").filter(t => document.querySelector(t)).join(", ");
        if (validTargets) {
          gsap.killTweensOf(validTargets);
        }
      };
    }
  }, [loading, vets.length, appointments.length]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVet) return;

    setSaving(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          vetId: selectedVet.id,
        }),
      });

      const data = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (data.success) {
        toast({
          title: "Appointment booked",
          description: data.message,
        });
        setBookingDialogOpen(false);
        fetchData();
        resetForm();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to book appointment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedVet(null);
    setFormData({
      petId: "",
      date: "",
      time: "",
      type: "consultation",
      reason: "",
      notes: "",
    });
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setVetsPage(1);
  }, [searchQuery]);

  const handleDownloadReport = async () => {
    if (!reportRef.current || !selectedAppointmentForReport) return;

    try {
      // 1. Pre-sanitize the DOM to remove oklch which crashes html2canvas
      const sanitizeElement = (el: HTMLElement) => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.color.includes('oklch')) el.style.color = '#1e293b';
        if (computedStyle.backgroundColor.includes('oklch')) el.style.backgroundColor = 'transparent';
        if (computedStyle.borderColor.includes('oklch')) el.style.borderColor = '#e2e8f0';
        
        Array.from(el.children).forEach(child => sanitizeElement(child as HTMLElement));
      };

      // 2. Capture with onclone for final polishing
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('[data-report="appointment-report"]') as HTMLElement;
          if (element) {
            element.style.height = 'auto';
            element.style.overflow = 'visible';
            
            // Final deep sanitize in the cloned document
            const all = element.getElementsByTagName('*');
            for (let i = 0; i < all.length; i++) {
              const el = all[i] as HTMLElement;
              const style = window.getComputedStyle(el);
              if (style.color.includes('oklch')) el.style.color = '#1e293b';
              if (style.backgroundColor.includes('oklch')) el.style.backgroundColor = 'transparent';
              if (style.borderColor.includes('oklch')) el.style.borderColor = '#e2e8f0';
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
      pdf.save(`Medical_Report_${selectedAppointmentForReport.pet.name}_${selectedAppointmentForReport.id.slice(0, 8)}.pdf`);

      toast({
        title: "Report Downloaded",
        description: "Clinical summary has been saved as PDF.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Download Failed",
        description: "Please try again. Chrome/Edge recommended.",
        variant: "destructive",
      });
    }
  };



  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const allFilteredVets = vets.filter((vet) =>
    vet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.clinic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const vetsTotalPages = Math.ceil(allFilteredVets.length / VETS_PER_PAGE);
  const vetsStartIdx = (vetsPage - 1) * VETS_PER_PAGE;
  const filteredVets = allFilteredVets.slice(vetsStartIdx, vetsStartIdx + VETS_PER_PAGE);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  );

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
      <div>
        <h1 className="text-3xl font-bold appointments-header">Appointments</h1>
        <p className="text-muted-foreground appointments-subtitle">Book and manage your veterinary appointments</p>
      </div>

      <Tabs defaultValue="book" className="space-y-6">
        <TabsList className="tabs-container">
          <TabsTrigger value="book" className="tab-trigger">Find Veterinarians</TabsTrigger>
          <TabsTrigger value="upcoming" className="tab-trigger">Upcoming ({upcomingAppointments.length})</TabsTrigger>
          <TabsTrigger value="history" className="tab-trigger">History</TabsTrigger>
        </TabsList>

        {/* Book Tab */}
        <TabsContent value="book" className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md search-container">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground search-icon" />
            <Input
              placeholder="Search by name, specialty, or clinic..."
              className="pl-10 search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Vets Grid */}
          {filteredVets.length > 0 ? (
            <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVets.map((vet) => (
              <Card key={vet.id} className="overflow-hidden vet-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 vet-avatar">
                      <AvatarImage src={vet.photo || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {vet.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => router.push(`/dashboard/vets/${vet.id}`)}
                        className="font-semibold text-lg truncate text-left hover:text-primary transition-colors"
                      >
                        {vet.name}
                      </button>
                      <p className="text-sm text-primary">{vet.specialization}</p>
                      <p className="text-sm text-muted-foreground">{vet.clinic}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm vet-rating">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span>{vet.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">
                        ({vet.reviewCount} reviews)
                      </span>
                    </div>
                    {vet.experience && (
                      <p className="text-sm text-muted-foreground">
                        {vet.experience} years experience
                      </p>
                    )}
                    {vet.consultationFee && (
                      <p className="text-sm font-medium">
                        ${vet.consultationFee} consultation
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      setSelectedVet(vet);
                      setBookingDialogOpen(true);
                    }}
                    disabled={pets.length === 0}
                  >
                    {pets.length === 0 ? "Add a pet first" : "Book Appointment"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Pagination Controls */}
          {vetsTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVetsPage(Math.max(1, vetsPage - 1))}
                disabled={vetsPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: vetsTotalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={vetsPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVetsPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVetsPage(Math.min(vetsTotalPages, vetsPage + 1))}
                disabled={vetsPage === vetsTotalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
            </>
          ) : (
            <Card className="empty-vets-state">
              <CardContent className="py-12 text-center">
                <Stethoscope className="h-16 w-16 mx-auto text-muted-foreground mb-4 empty-vets-icon" />
                <h3 className="text-lg font-semibold mb-2">No veterinarians found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground">
                  Book an appointment with one of our veterinarians
                </p>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((apt) => (
              <Card key={apt.id} className="appointment-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/vets/${apt.vet.id}`)}
                            className="font-semibold text-primary hover:underline"
                          >
                            {apt.vet.name}
                          </button>
                          <Badge className={getStatusColor(apt.status)}>
                            {getStatusIcon(apt.status)}
                            <span className="ml-1">{apt.status}</span>
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setSelectedAppointmentForReport(apt);
                            setReportDialogOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Report
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {apt.vet.specialization} • {apt.vet.clinic}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(apt.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {apt.time}
                        </span>
                        <span>For {apt.pet.name}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No appointment history</h3>
                <p className="text-muted-foreground">
                  Your completed appointments will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            pastAppointments.map((apt) => (
              <Card key={apt.id} className="opacity-75 appointment-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/vets/${apt.vet.id}`)}
                            className="font-semibold text-primary hover:underline"
                          >
                            {apt.vet.name}
                          </button>
                          <Badge className={getStatusColor(apt.status)}>
                            {apt.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setSelectedAppointmentForReport(apt);
                            setReportDialogOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Report
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(apt.date)} at {apt.time}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>



      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Schedule an appointment with {selectedVet?.name}
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
      {/* Medical Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col bg-slate-50 border-none shadow-2xl">
          <div className="sr-only">
            <DialogTitle>Clinical Report for {selectedAppointmentForReport?.pet.name}</DialogTitle>
            <DialogDescription>Official veterinary clinical documentation</DialogDescription>
          </div>
          
          <div className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Clinical Summary Report</h3>
              <p className="text-xs text-slate-500 font-medium">Official medical record for {selectedAppointmentForReport?.pet.name}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadReport} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md transition-all active:scale-95 px-4">
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
              ref={reportRef}
              data-report="appointment-report"
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
                  <p style={{ fontSize: "16px", fontWeight: "900", color: "#3b82f6", margin: "0" }}>CLINICAL REPORT</p>
                  <p style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", fontWeight: "700" }}>ID: #{selectedAppointmentForReport?.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              {/* Patient & Client Meta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                <div>
                  <h5 style={{ fontSize: "9px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Patient Details</h5>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: "0" }}>{selectedAppointmentForReport?.pet.name} <span style={{ fontWeight: "400", color: "#64748b", fontSize: "11px" }}>({selectedAppointmentForReport?.pet.species})</span></p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>Breed: {selectedAppointmentForReport?.pet.breed || "N/A"}</p>
                </div>
                <div>
                  <h5 style={{ fontSize: "9px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Pet Owner Details</h5>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: "0" }}>{currentUser?.name || "Client"}</p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>{currentUser?.email || "N/A"}</p>
                </div>
              </div>

              {/* Rx / Visit Details */}
              <div style={{ marginBottom: "25px", backgroundColor: "#ffffff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", backgroundColor: "#ffffff" }}>
                  <span style={{ fontSize: "28px", fontWeight: "900", color: "#3b82f6", fontFamily: "serif" }}>Rx</span>
                  <div style={{ height: "1px", flex: 1, backgroundColor: "#e2e8f0" }}></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "30px", backgroundColor: "#ffffff" }}>
                  <div style={{ backgroundColor: "#ffffff" }}>
                    <div style={{ marginBottom: "12px", backgroundColor: "#ffffff" }}>
                      <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "800", textTransform: "uppercase", margin: "0" }}>Visit Information</p>
                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", margin: "4px 0 0 0" }}>{selectedAppointmentForReport?.type.toUpperCase()}</p>
                      <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>{formatDate(selectedAppointmentForReport?.date || "")}</p>
                    </div>
                    <div style={{ backgroundColor: "#ffffff" }}>
                      <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "800", textTransform: "uppercase", margin: "0" }}>Duration</p>
                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", margin: "4px 0 0 0" }}>{selectedAppointmentForReport?.duration} Minutes</p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#ffffff" }}>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "800", textTransform: "uppercase", margin: "0" }}>Primary Complaint / Reason</p>
                    <p style={{ fontSize: "12px", color: "#334155", marginTop: "6px", lineHeight: "1.6", fontStyle: "italic", backgroundColor: "#ffffff" }}>
                      "{selectedAppointmentForReport?.reason || "General health consultation and routine check-up."}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Findings & Notes */}
              <div style={{ marginBottom: "30px", padding: "15px", border: "1px dashed #cbd5e1", borderRadius: "8px", backgroundColor: "#ffffff" }}>
                <h5 style={{ fontSize: "10px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Clinical Observations & Recommendations</h5>
                <p style={{ fontSize: "12px", color: "#334155", lineHeight: "1.8", margin: "0", minHeight: "100px", backgroundColor: "#ffffff" }}>
                  {selectedAppointmentForReport?.notes || "Patient appears healthy. Vital signs within normal range for species. Recommended follow-up in 6 months for routine evaluation."}
                </p>
              </div>

              {/* Footer / Verification */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: "20px", borderTop: "1px solid #f1f5f9", backgroundColor: "#ffffff" }}>
                <div style={{ backgroundColor: "#ffffff" }}>
                  <div style={{ width: "180px", borderBottom: "1px solid #1e293b", marginBottom: "8px" }}></div>
                  <p style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b", margin: "0" }}>Dr. {selectedAppointmentForReport?.vet.name}</p>
                  <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0 0" }}>{selectedAppointmentForReport?.vet.specialization}</p>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0 0" }}>{selectedAppointmentForReport?.vet.clinic}</p>
                  <p style={{ fontSize: "9px", color: "#94a3b8", marginTop: "4px" }}>Digital Authorization ID: PET-{selectedAppointmentForReport?.id.slice(-6).toUpperCase()}</p>
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
                    <p style={{ fontSize: "8px", fontWeight: "900", color: "#3b82f6", margin: "2px 0 0 0" }}>VERIFIED</p>
                  </div>
                  <p style={{ fontSize: "9px", color: "#94a3b8", marginTop: "10px" }}>Report Issued: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ marginTop: "20px", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "10px", backgroundColor: "#ffffff" }}>
                <p style={{ fontSize: "8px", color: "#cbd5e1", margin: "0" }}>This is a computer-generated clinical report and does not require a physical signature for digital verification. PetCare Pro Platform.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
