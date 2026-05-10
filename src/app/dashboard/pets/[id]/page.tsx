"use client";

export const runtime = "edge";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Syringe, 
  Calendar, 
  FileText, 
  Weight, 
  Droplets, 
  Activity, 
  Clock,
  User,
  MapPin,
  Pill,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import gsap from "gsap";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  gender: string;
  color: string;
  photo: string;
  medicalNotes: string;
  bloodGroup: string;
  isNeutered: number;
  lastCheckup: string;
}

interface Vaccination {
  id: string;
  name: string; -- Matched to schema 'name'
  dateAdministered: string;
  nextDueDate: string;
  notes: string;
  veterinarian: string; -- Matched to schema 'veterinarian'
}

interface Appointment {
  id: string;
  type: string; -- Matched to schema 'type'
  status: string;
  date: string; -- Matched to schema 'date'
  time: string; -- Matched to schema 'time'
  reason: string;
}

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<Pet | null>(null);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchPetDetails();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (!loading && pet) {
      const ctx = gsap.context(() => {
        gsap.from(".pet-hero", { opacity: 0, y: 30, duration: 0.8, ease: "power3.out" });
        gsap.from(".pet-stat-card", { 
          opacity: 0, 
          scale: 0.9, 
          duration: 0.5, 
          stagger: 0.1, 
          ease: "back.out(1.7)",
          delay: 0.3
        });
        gsap.from(".pet-content-tabs", { opacity: 0, y: 20, duration: 0.6, delay: 0.6 });
      });
      return () => ctx.revert();
    }
  }, [loading, pet]);

  const fetchPetDetails = async () => {
    try {
      const response = await fetch(`/api/pets/${resolvedParams.id}`);
      const data = await response.json();
      if (data.success) {
        setPet(data.pet);
        setVaccinations(data.vaccinations || []);
        setAppointments(data.appointments || []);
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        router.push("/dashboard/pets");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch pet details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pet) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/dashboard/pets">
            <ChevronLeft className="h-4 w-4" />
            Back to Pets
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">Edit Details</Button>
          <Button variant="destructive">Remove Pet</Button>
        </div>
      </div>

      {/* Pet Hero Section */}
      <Card className="pet-hero overflow-hidden border-none bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="relative">
              <Avatar className="h-48 w-48 border-4 border-background shadow-xl">
                <AvatarImage src={pet.photo} />
                <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                  {pet.name[0]}
                </AvatarFallback>
              </Avatar>
              <Badge className="absolute bottom-2 right-2 px-3 py-1 text-sm shadow-lg">
                {pet.species}
              </Badge>
            </div>
            
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">{pet.name}</h1>
                <p className="text-xl text-muted-foreground">{pet.breed}</p>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  <Activity className="h-3 w-3" />
                  {pet.gender}
                </Badge>
                <Badge variant="outline" className="gap-1 px-3 py-1">
                  <Clock className="h-3 w-3" />
                  {pet.age}
                </Badge>
                {pet.isNeutered === 1 && (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1 px-3 py-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Neutered
                  </Badge>
                )}
              </div>

              <div className="flex items-start gap-2 bg-background/50 p-4 rounded-xl border backdrop-blur-sm max-w-2xl">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <p className="text-sm leading-relaxed italic">
                  {pet.medicalNotes || "No medical notes recorded for this pet."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vital Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Weight", value: pet.weight || "N/A", icon: Weight, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Blood Group", value: pet.bloodGroup || "N/A", icon: Droplets, color: "text-red-500", bg: "bg-red-50" },
          { label: "Last Checkup", value: pet.lastCheckup || "N/A", icon: Calendar, color: "text-purple-500", bg: "bg-purple-50" },
          { label: "Color", value: pet.color || "N/A", icon: Pill, color: "text-amber-500", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="pet-stat-card">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} mb-2`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="vaccinations" className="pet-content-tabs w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="vaccinations" className="gap-2">
            <Syringe className="h-4 w-4" />
            Vaccinations
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="vaccinations" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vaccination History</CardTitle>
                <CardDescription>Comprehensive record of all administered vaccines</CardDescription>
              </div>
              <Button size="sm">Add Record</Button>
            </CardHeader>
            <CardContent>
              {vaccinations.length > 0 ? (
                <div className="relative border-l-2 border-primary/20 ml-3 pl-8 space-y-8 py-4">
                  {vaccinations.map((v, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-primary border-4 border-background shadow-sm" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold">{v.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Administered on {v.dateAdministered}
                          </div>
                          {v.notes && <p className="text-sm mt-2 p-3 bg-muted rounded-lg">{v.notes}</p>}
                        </div>
                        <div className="text-right">
                          {v.veterinarian && <Badge variant="outline" className="mb-2">Dr. {v.veterinarian}</Badge>}
                          {v.nextDueDate && (
                            <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                              <AlertCircle className="h-4 w-4" />
                              Next Due: {v.nextDueDate}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Syringe className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No vaccination records found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Appointment History</CardTitle>
                <CardDescription>History of clinical visits and consultations</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/appointments/new">Book New</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((a, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                      <div className={`p-3 rounded-full ${
                        a.status === 'completed' ? 'bg-green-100 text-green-600' : 
                        a.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg">{a.type}</h4>
                            <p className="text-sm text-muted-foreground">{a.reason}</p>
                          </div>
                          <Badge variant={
                            a.status === 'completed' ? 'default' : 
                            a.status === 'cancelled' ? 'destructive' : 'secondary'
                          } className="capitalize">
                            {a.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {a.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {a.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No past appointments found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
