"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle, User, PawPrint, Phone, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  reason: string;
  type: string;
  createdAt: string;
  petName: string;
  species: string;
  ownerName: string;
  ownerPhone: string | null;
  ownerEmail: string;
  vetName: string;
}

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/receptionist/appointments");
      if (response.ok) {
        const data = (await response.json()) as { appointments: Appointment[]; _debug?: any };
        console.log("Receptionist Appointments Debug:", data._debug);
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error("Fetch appointments error:", error);
      toast({ title: "Error", description: "Failed to load appointments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatDateSafely = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE, MMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/receptionist/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id, status })
      });

      if (response.ok) {
        toast({ title: "Success", description: `Appointment ${status} successfully.` });
        fetchAppointments();
      } else {
        const data = (await response.json()) as { error?: string };
        toast({ title: "Error", description: data.error || "Failed to update appointment", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'scheduled');
  const pastAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const AppointmentCard = ({ apt, showActions = false }: { apt: Appointment, showActions?: boolean }) => (
    <Card key={apt.id} className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant={
            apt.status === 'pending' ? 'outline' : 
            (apt.status === 'confirmed' || apt.status === 'scheduled') ? 'default' : 
            apt.status === 'cancelled' ? 'destructive' : 'secondary'
          }>
            {apt.status.toUpperCase()}
          </Badge>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{apt.type}</p>
          </div>
        </div>
        <CardTitle className="mt-2 text-lg flex items-center gap-2">
          {apt.petName} <span className="text-sm font-normal text-muted-foreground capitalize">({apt.species})</span>
        </CardTitle>
        <CardDescription>with {apt.vetName}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <div className="flex items-center gap-2 text-primary">
            <CalendarIcon className="h-4 w-4" />
            <span className="font-medium">{formatDateSafely(apt.date)}</span>
            <Clock className="h-4 w-4 ml-2" />
            <span className="font-medium">{apt.time}</span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <p className="font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" /> {apt.ownerName}
          </p>
          {apt.ownerPhone && (
            <p className="text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" /> {apt.ownerPhone}
            </p>
          )}
          <p className="text-muted-foreground flex items-center gap-2">
            <Mail className="h-4 w-4" /> {apt.ownerEmail}
          </p>
        </div>

        {apt.reason && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-1">Reason for visit:</p>
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md line-clamp-2">{apt.reason}</p>
          </div>
        )}
      </CardContent>
      {showActions && (
        <CardFooter className="flex gap-2 border-t pt-4">
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
            onClick={() => updateStatus(apt.id, 'confirmed')}
            disabled={updatingId === apt.id}
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Accept
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1"
            onClick={() => updateStatus(apt.id, 'cancelled')}
            disabled={updatingId === apt.id}
          >
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </CardFooter>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Receptionist Panel</h1>
        <p className="text-muted-foreground">Manage and route appointments for your assigned veterinarians.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="relative">
            Needs Action
            {pendingAppointments.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-[10px] text-primary-foreground">
                {pendingAppointments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {pendingAppointments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-4 opacity-20" />
                <p>You're all caught up! No pending appointments to review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingAppointments.map(apt => <AppointmentCard key={apt.id} apt={apt} showActions={true} />)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="upcoming">
          {upcomingAppointments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                <p>No upcoming scheduled appointments.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingAppointments.map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          {pastAppointments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mb-4 opacity-20" />
                <p>No appointment history.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastAppointments.map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
