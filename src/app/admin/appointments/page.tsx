"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Calendar,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  PawPrint,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  reason: string | null;
  type: string;
  status: string;
  createdAt: string;
  pet: {
    name: string;
    species: string;
  };
  vet: {
    name: string;
    specialization: string;
    clinic: string;
  };
  user: {
    name: string | null;
    email: string;
  };
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 10;

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      
      const response = await fetch(`/api/admin/appointments?${params}&limit=${LIMIT}&offset=0`);
      if (response.ok) {
        const data = (await response.json()) as { appointments?: Appointment[], total?: number };
        setAppointments(data.appointments || []);
        setTotal(data.total || 0);
        setOffset(0);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointments.length > 0) {
      gsap.fromTo(
        ".admin-appointment-card",
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.05,
          ease: "power2.out",
          overwrite: "auto",
        }
      );
    }
  }, [appointments.length]);

  const loadMoreAppointments = async () => {
    setLoadingMore(true);
    const nextOffset = offset + LIMIT;
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/appointments?${params}&limit=${LIMIT}&offset=${nextOffset}`);
      if (res.ok) {
        const data = (await res.json()) as { appointments?: Appointment[] };
        setAppointments((prev) => [...prev, ...(data.appointments || [])]);
        setOffset(nextOffset);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredAppointments = appointments.filter((apt) =>
    apt.user.email.toLowerCase().includes(search.toLowerCase()) ||
    apt.vet.name.toLowerCase().includes(search.toLowerCase()) ||
    apt.pet.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage all appointments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, vet, or pet..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No appointments found</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="space-y-4 pr-4">
            {filteredAppointments.map((apt) => (
              <Card key={apt.id} className="admin-appointment-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{apt.vet.name}</h3>
                        <Badge className={getStatusColor(apt.status)}>
                          {getStatusIcon(apt.status)}
                          <span className="ml-1">{apt.status}</span>
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {apt.user.name || apt.user.email}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <PawPrint className="h-3 w-3" />
                          {apt.pet.name}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(apt.date)} at {apt.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{apt.type}</p>
                      <p className="text-xs text-muted-foreground">{apt.duration} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {appointments.length < total && (
            <div className="flex justify-center mt-6 pb-6">
              <Button
                variant="outline"
                onClick={loadMoreAppointments}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Appointments"
                )}
              </Button>
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
