"use client";

export const runtime = "edge";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import {
  PawPrint,
  Calendar,
  Syringe,
  Users,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalPets: number;
  totalAppointments: number;
  upcomingVaccinations: number;
  totalPosts: number;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photo: string | null;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  reason: string | null;
  vet: {
    name: string;
    specialization: string;
  };
  pet: {
    name: string;
    species: string;
  };
}

interface Vaccination {
  id: string;
  name: string;
  nextDueDate: string | null;
  status: string;
  pet: {
    name: string;
    species: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch("/api/dashboard/stats");
      if (statsRes.ok) {
        const statsData = (await statsRes.json()) as DashboardStats;
        setStats(statsData);
      }

      // Fetch pets
      const petsRes = await fetch("/api/pets");
      if (petsRes.ok) {
        const petsData = (await petsRes.json()) as { pets?: Pet[] };
        setPets(petsData.pets || []);
      }

      // Fetch upcoming appointments
      const appointmentsRes = await fetch("/api/appointments?status=pending,confirmed&limit=5");
      if (appointmentsRes.ok) {
        const appointmentsData = (await appointmentsRes.json()) as { appointments?: Appointment[] };
        setAppointments(appointmentsData.appointments || []);
      }

      // Fetch upcoming vaccinations
      const vaccinationsRes = await fetch("/api/vaccinations?status=scheduled&limit=5");
      if (vaccinationsRes.ok) {
        const vaccinationsData = (await vaccinationsRes.json()) as { vaccinations?: Vaccination[] };
        setVaccinations(vaccinationsData.vaccinations || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        // Header animations
        if (document.querySelector(".dashboard-title")) {
          gsap.fromTo(
            ".dashboard-title",
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
          );
        }

        if (document.querySelector(".dashboard-subtitle")) {
          gsap.fromTo(
            ".dashboard-subtitle",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "power2.out" }
          );
        }

        // Stats cards animations
        if (document.querySelector(".stat-card")) {
          gsap.fromTo(
            ".stat-card",
            { opacity: 0, y: 40, scale: 0.9 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: "back.out(1.7)",
              delay: 0.4
            }
          );
        }

        if (document.querySelector(".stat-icon")) {
          gsap.fromTo(
            ".stat-icon",
            { scale: 0, rotation: -180 },
            {
              scale: 1,
              rotation: 0,
              duration: 0.8,
              stagger: 0.15,
              ease: "back.out(1.7)",
              delay: 0.6
            }
          );
        }

        if (document.querySelector(".stat-value")) {
          gsap.fromTo(
            ".stat-value",
            { opacity: 0, scale: 0.5 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: "power2.out",
              delay: 0.8
            }
          );
        }

        // Quick actions animations
        if (document.querySelector(".quick-actions-card")) {
          gsap.fromTo(
            ".quick-actions-card",
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 1.0 }
          );
        }

        if (document.querySelector(".quick-action-btn")) {
          gsap.fromTo(
            ".quick-action-btn",
            { opacity: 0, scale: 0.8 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.5,
              stagger: 0.08,
              ease: "back.out(1.7)",
              delay: 1.2
            }
          );
        }

        // Section animations
        if (document.querySelector(".dashboard-section")) {
          gsap.fromTo(
            ".dashboard-section",
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.2,
              ease: "power2.out",
              delay: 1.4
            }
          );
        }

        if (document.querySelector(".section-title")) {
          gsap.fromTo(
            ".section-title",
            { opacity: 0, x: -20 },
            {
              opacity: 1,
              x: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "power2.out",
              delay: 1.6
            }
          );
        }

        if (document.querySelector(".section-description")) {
          gsap.fromTo(
            ".section-description",
            { opacity: 0, x: -15 },
            {
              opacity: 1,
              x: 0,
              duration: 0.5,
              stagger: 0.1,
              ease: "power2.out",
              delay: 1.8
            }
          );
        }

        // Interactive hover effects
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
          card.addEventListener('mouseenter', () => {
            gsap.to(card, {
              y: -5,
              scale: 1.02,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
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

        const actionButtons = document.querySelectorAll('.quick-action-btn');
        actionButtons.forEach(btn => {
          btn.addEventListener('mouseenter', () => {
            gsap.to(btn, {
              scale: 1.05,
              y: -2,
              duration: 0.2,
              ease: "power2.out"
            });
          });
          
          btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
              scale: 1,
              y: 0,
              duration: 0.2,
              ease: "power2.out"
            });
          });
        });
      });

      return () => ctx.revert();
    }
  }, [loading]);

  const getSpeciesEmoji = (species: string) => {
    const emojis: Record<string, string> = {
      dog: "🐕",
      cat: "🐱",
      bird: "🐦",
      fish: "🐠",
      rabbit: "🐰",
      hamster: "🐹",
      other: "🐾",
    };
    return emojis[species.toLowerCase()] || "🐾";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground dashboard-subtitle">Welcome back! Here&apos;s an overview of your pet care.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-stat-card card-accent-green stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider stat-title">Total Pets</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg stat-icon">
              <PawPrint className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight stat-value">{stats?.totalPets || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 stat-description">Founders & companions</p>
          </CardContent>
        </Card>
        <Card className="dashboard-stat-card card-accent-green stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider stat-title">Appointments</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg stat-icon">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight stat-value">{stats?.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 stat-description">Confirmed with specialists</p>
          </CardContent>
        </Card>
        <Card className="dashboard-stat-card card-accent-green stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider stat-title">Vaccinations Due</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg stat-icon">
              <Syringe className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight stat-value">{stats?.upcomingVaccinations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 stat-description">Pending health checks</p>
          </CardContent>
        </Card>
        <Card className="dashboard-stat-card card-accent-green stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider stat-title">Social Posts</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg stat-icon">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight stat-value">{stats?.totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 stat-description">Community interactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="dashboard-section quick-actions-card">
        <CardHeader>
          <CardTitle className="section-title">Quick Actions</CardTitle>
          <CardDescription className="section-description">Common tasks at your fingertips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="quick-action-btn">
              <Link href="/dashboard/pets">
                <Plus className="mr-2 h-4 w-4" />
                Add Pet
              </Link>
            </Button>
            <Button variant="outline" asChild className="quick-action-btn">
              <Link href="/dashboard/appointments">
                <Calendar className="mr-2 h-4 w-4" />
                Book Appointment
              </Link>
            </Button>
            <Button variant="outline" asChild className="quick-action-btn">
              <Link href="/dashboard/vaccinations">
                <Syringe className="mr-2 h-4 w-4" />
                Add Vaccination
              </Link>
            </Button>
            <Button variant="outline" asChild className="quick-action-btn">
              <Link href="/dashboard/social">
                <Users className="mr-2 h-4 w-4" />
                Create Post
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Pets */}
        <Card className="dashboard-section card-accent-green shadow-lg shadow-primary/5 pets-section">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="section-title">My Pets</CardTitle>
              <CardDescription className="section-description">Your registered pets</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="view-all-btn">
              <Link href="/dashboard/pets">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pets.length === 0 ? (
              <div className="text-center py-8">
                <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No pets registered yet</p>
                <Button asChild>
                  <Link href="/dashboard/pets">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Pet
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pets.slice(0, 4).map((pet) => (
                  <div
                    key={pet.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                      {pet.photo ? (
                        <img src={pet.photo} alt={pet.name} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        getSpeciesEmoji(pet.species)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{pet.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pet.breed || pet.species}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="dashboard-section card-accent-green shadow-lg shadow-primary/5 appointments-section">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="section-title">Upcoming Appointments</CardTitle>
              <CardDescription className="section-description">Your scheduled visits</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="view-all-btn">
              <Link href="/dashboard/appointments">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                <Button asChild>
                  <Link href="/dashboard/appointments">
                    <Plus className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{apt.vet.name}</p>
                        <Badge className={getStatusColor(apt.status)} variant="secondary">
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(apt.date)} at {apt.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        For {apt.pet.name} • {apt.vet.specialization}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Vaccinations */}
        <Card className="dashboard-section card-accent-green shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vaccination Schedule</CardTitle>
              <CardDescription>Upcoming vaccinations</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/vaccinations">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {vaccinations.length === 0 ? (
              <div className="text-center py-8">
                <Syringe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No vaccinations scheduled</p>
                <Button asChild>
                  <Link href="/dashboard/vaccinations">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vaccination Record
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {vaccinations.slice(0, 4).map((vax) => (
                  <div
                    key={vax.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Syringe className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{vax.name}</p>
                        <Badge className={getStatusColor(vax.status)} variant="secondary">
                          {vax.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        For {vax.pet.name}
                      </p>
                      {vax.nextDueDate && (
                        <p className="text-sm text-muted-foreground">
                          Due: {formatDate(vax.nextDueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications / Activity */}
        <Card className="dashboard-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest pet care updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Welcome to PetCare Pro!</p>
                  <p className="text-xs text-muted-foreground">
                    Start by adding your first pet
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Account created</p>
                  <p className="text-xs text-muted-foreground">
                    Your journey begins now
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
