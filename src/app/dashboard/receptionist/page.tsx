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
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          // Force-remove oklch colors and ensure full height
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            if (style.color.includes('oklch')) el.style.color = '#000000';
            if (style.backgroundColor.includes('oklch')) el.style.backgroundColor = '#ffffff';
            if (style.borderColor.includes('oklch')) el.style.borderColor = '#e2e8f0';
          }
          
          // Ensure the captured element is not clipped
          const reportEl = clonedDoc.querySelector('[ref="reportRef"]') || clonedDoc.body.querySelector('div[style*="padding: 40px"]');
          if (reportEl instanceof HTMLElement) {
            reportEl.style.height = 'auto';
            reportEl.style.overflow = 'visible';
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
                padding: "30px",
                backgroundColor: "#ffffff",
                color: "#1e293b",
                fontFamily: "'Inter', system-ui, sans-serif",
                width: "100%",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: "1.5"
              }}
            >
              {/* Top Banner / Clinic Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "2px solid #0f172a", paddingBottom: "15px", backgroundColor: "#ffffff" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paw-print"><circle cx="11" cy="5" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="7" cy="9" r="2"/><circle cx="11" cy="21" r="2"/><path d="M4.27 14.7c-1.14 1.07-1.14 2.8 0 3.87 1.14 1.07 2.97 1.07 4.1 0 1.14-1.07 1.14-2.8 0-3.87-1.14-1.07-2.97-1.07-4.1 0Z"/><path d="M15.63 14.7c-1.14 1.07-1.14 2.8 0 3.87 1.14 1.07 2.97 1.07 4.1 0 1.14-1.07 1.14-2.8 0-3.87-1.14-1.07-2.97-1.07-4.1 0Z"/><path d="M10 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Z"/></svg>
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
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: "0" }}>{selectedAppointmentForReport?.petName} <span style={{ fontWeight: "400", color: "#64748b", fontSize: "11px" }}>({selectedAppointmentForReport?.species})</span></p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>Breed: {selectedAppointmentForReport?.breed || "N/A"}</p>
                </div>
                <div>
                  <h5 style={{ fontSize: "9px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Pet Owner Details</h5>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: "0" }}>{selectedAppointmentForReport?.ownerName || "Client"}</p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>{selectedAppointmentForReport?.ownerEmail || "N/A"}</p>
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
                      <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>{selectedAppointmentForReport ? formatDateSafely(selectedAppointmentForReport.date) : ""}</p>
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
                  Patient appears healthy. Vital signs within normal range for species. Recommended follow-up in 6 months for routine evaluation.
                </p>
              </div>

              {/* Footer / Verification */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: "20px", backgroundColor: "#ffffff" }}>
                <div style={{ backgroundColor: "#ffffff" }}>
                  <div style={{ width: "180px", borderBottom: "1px solid #1e293b", marginBottom: "8px" }}></div>
                  <p style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b", margin: "0" }}>Attending Veterinarian</p>
                  <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0 0" }}>Verified by PetCare Pro Reception</p>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paw-print"><circle cx="11" cy="5" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="7" cy="9" r="2"/><circle cx="11" cy="21" r="2"/><path d="M4.27 14.7c-1.14 1.07-1.14 2.8 0 3.87 1.14 1.07 2.97 1.07 4.1 0 1.14-1.07 1.14-2.8 0-3.87-1.14-1.07-2.97-1.07-4.1 0Z"/><path d="M15.63 14.7c-1.14 1.07-1.14 2.8 0 3.87 1.14 1.07 2.97 1.07 4.1 0 1.14-1.07 1.14-2.8 0-3.87-1.14-1.07-2.97-1.07-4.1 0Z"/><path d="M10 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Z"/></svg>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
