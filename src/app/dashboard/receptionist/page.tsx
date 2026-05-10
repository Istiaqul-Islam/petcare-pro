"use client";

export const runtime = "edge";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle, User, PawPrint, Phone, Mail, FileText, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";
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

interface Veterinarian {
  id: string;
  name: string;
  specialization: string;
}

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/receptionist/appointments");
      if (response.ok) {
        const data = (await response.json()) as { 
          appointments: Appointment[]; 
          veterinarians: Veterinarian[];
          _debug?: any 
        };
        setAppointments(data.appointments || []);
        setVeterinarians(data.veterinarians || []);
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

  const updateAppointment = async (id: string, updates: { status?: string; vetId?: string }) => {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/receptionist/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id, ...updates })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Appointment updated successfully." });
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

  const handleDownloadReport = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Force-remove oklch colors which html2canvas can't parse
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            if (style.color.includes('oklch')) el.style.color = '#000000';
            if (style.backgroundColor.includes('oklch')) el.style.backgroundColor = '#ffffff';
            if (style.borderColor.includes('oklch')) el.style.borderColor = '#e2e8f0';
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reception_Report_${selectedAppointmentForReport?.id.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF report.",
      });
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
          <div className="flex items-center gap-2">
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
            <Badge variant={
              apt.status === 'pending' ? 'outline' : 
              (apt.status === 'confirmed' || apt.status === 'scheduled') ? 'default' : 
              apt.status === 'cancelled' ? 'destructive' : 'secondary'
            }>
              {apt.status.toUpperCase()}
            </Badge>
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

        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">Reassign Doctor:</p>
          <select 
            className="w-full p-2 text-sm rounded-md border bg-background"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                updateAppointment(apt.id, { vetId: e.target.value });
              }
            }}
            disabled={updatingId === apt.id}
          >
            <option value="" disabled>Change Veterinarian...</option>
            {veterinarians.map(v => (
              <option key={v.id} value={v.id}>Dr. {v.name} ({v.specialization})</option>
            ))}
          </select>
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
            onClick={() => updateAppointment(apt.id, { status: 'confirmed' })}
            disabled={updatingId === apt.id}
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Accept
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1"
            onClick={() => updateAppointment(apt.id, { status: 'cancelled' })}
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
      {/* Medical Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Appointment Clinical Report</DialogTitle>
                <DialogDescription>Review and download the clinical summary for this visit</DialogDescription>
              </div>
              <Button onClick={handleDownloadReport} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div 
              ref={reportRef} 
              style={{ 
                padding: "40px",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                fontFamily: "'Inter', sans-serif",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                width: "100%",
                maxWidth: "800px",
                margin: "0 auto"
              }}
            >
              {/* Header / Letterhead */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "flex-start", 
                borderBottom: "2px solid #3b82f6", 
                paddingBottom: "24px",
                marginBottom: "32px",
                backgroundColor: "#ffffff"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ 
                      height: "40px", 
                      width: "40px", 
                      borderRadius: "8px", 
                      backgroundColor: "#3b82f6", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center" 
                    }}>
                      <PawPrint style={{ height: "24px", width: "24px", color: "#ffffff" }} />
                    </div>
                    <span style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-0.025em", color: "#1e293b" }}>PetCare Pro</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Advanced Veterinary Management System</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", margin: "0" }}>Document Type</h4>
                  <p style={{ fontSize: "18px", fontWeight: "800", color: "#3b82f6", margin: "4px 0 0 0" }}>CLINICAL SUMMARY</p>
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>REF: #{selectedAppointmentForReport?.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              {/* Patient & Owner Info Section */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "40px", backgroundColor: "#ffffff" }}>
                <div style={{ backgroundColor: "#ffffff" }}>
                  <h5 style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Patient Information</h5>
                  <div style={{ backgroundColor: "#ffffff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#ffffff" }}>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>Name:</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{selectedAppointmentForReport?.petName}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid #f1f5f9", marginTop: "8px", backgroundColor: "#ffffff" }}>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>Species:</span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{selectedAppointmentForReport?.species}</span>
                    </div>
                  </div>
                </div>
                <div style={{ backgroundColor: "#ffffff" }}>
                  <h5 style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Owner Information</h5>
                  <div style={{ backgroundColor: "#ffffff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#ffffff" }}>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>Owner:</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{selectedAppointmentForReport?.ownerName}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid #f1f5f9", marginTop: "8px", backgroundColor: "#ffffff" }}>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>Email:</span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{selectedAppointmentForReport?.ownerEmail || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div style={{ backgroundColor: "#f8fafc", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "40px" }}>
                <h5 style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>Clinical Appointment Details</h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", margin: "0" }}>Visit Type</p>
                    <p style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "4px 0 0 0" }}>{selectedAppointmentForReport?.type.toUpperCase()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", margin: "0" }}>Status</p>
                    <p style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "4px 0 0 0" }}>{selectedAppointmentForReport?.status.toUpperCase()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", margin: "0" }}>Date & Time</p>
                    <p style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "4px 0 0 0" }}>{selectedAppointmentForReport ? formatDateSafely(selectedAppointmentForReport.date) : ""} at {selectedAppointmentForReport?.time}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: "40px", backgroundColor: "#ffffff" }}>
                <div style={{ marginBottom: "20px", backgroundColor: "#ffffff" }}>
                  <h5 style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Primary Reason for Visit</h5>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#334155", backgroundColor: "#f1f5f9", padding: "16px", borderRadius: "8px" }}>
                    {selectedAppointmentForReport?.reason || "General checkup and consultation."}
                  </p>
                </div>
              </div>

              {/* Medical Provider */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "32px", borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                <div style={{ backgroundColor: "#ffffff" }}>
                  <h5 style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Attending Veterinarian</h5>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: "0" }}>Dr. {selectedAppointmentForReport?.vetName}</p>
                </div>
                <div style={{ textAlign: "center", opacity: "0.05", backgroundColor: "#ffffff" }}>
                  <PawPrint style={{ height: "80px", width: "80px", color: "#0f172a" }} />
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px dashed #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", backgroundColor: "#ffffff" }}>
                <span>This document is a digital clinical summary generated by PetCare Pro.</span>
                <span>Report Generated: {new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
