"use client";

export const runtime = "edge";

import { useState, useEffect } from "react";
import { User, Shield, Plus, Trash2, CheckCircle2, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Receptionist {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  assignedVetIds: string[];
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface Vet {
  id: string;
  name: string;
  specialization: string;
}

export default function ReceptionistsAdminPage() {
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedVetIds, setSelectedVetIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, usersRes, vetsRes] = await Promise.all([
        fetch("/api/admin/receptionists"),
        fetch("/api/admin/users?limit=100"),
        fetch("/api/vets?limit=50")
      ]);

      if (recRes.ok) {
        const recData = (await recRes.json()) as { receptionists: Receptionist[] };
        setReceptionists(recData.receptionists || []);
      }
      if (usersRes.ok) {
        const usersData = (await usersRes.json()) as { users: AppUser[] };
        // Filter out existing receptionists and admins
        const availableUsers = (usersData.users || []).filter(
          (u: AppUser) => u.role === "user"
        );
        setUsers(availableUsers);
      }
      if (vetsRes.ok) {
        const vetsData = (await vetsRes.json()) as { vets: Vet[] };
        setVets(vetsData.vets || []);
      }
    } catch (error) {
      toast({
        title: "Error fetching data",
        description: "Could not load receptionists.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVetSelection = (vetId: string) => {
    setSelectedVetIds(prev =>
      prev.includes(vetId)
        ? prev.filter(id => id !== vetId)
        : [...prev, vetId]
    );
  };

  const handlePromote = async () => {
    if (!selectedUserId) {
      toast({ title: "Validation Error", description: "Please select a user.", variant: "destructive" });
      return;
    }
    if (selectedVetIds.length < 2) {
      toast({ title: "Validation Error", description: "Please select at least 2 doctors.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/receptionists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, vetIds: selectedVetIds })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Receptionist added successfully." });
        setIsDialogOpen(false);
        setSelectedUserId("");
        setSelectedVetIds([]);
        fetchData();
      } else {
        const data = (await response.json()) as { error?: string; details?: string };
        toast({ title: "Error", description: data.details || data.error || "Failed to add receptionist", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemote = async (userId: string) => {
    if (!confirm("Are you sure you want to remove the Receptionist role from this user?")) return;

    try {
      const response = await fetch(`/api/admin/receptionists?userId=${userId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast({ title: "Success", description: "Receptionist role removed." });
        fetchData();
      } else {
        const data = (await response.json()) as { error?: string };
        toast({ title: "Error", description: data.error || "Failed to remove role.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receptionists</h1>
          <p className="text-muted-foreground">Manage receptionists and their assigned veterinarians.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Receptionist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Promote User to Receptionist</DialogTitle>
              <DialogDescription>
                Select an existing user and assign them to at least 2 veterinarians to manage their schedules.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select User</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border rounded-md bg-muted/20">
                  {users.length === 0 ? (
                    <div className="col-span-2 p-2 text-sm text-center text-muted-foreground">No eligible users found</div>
                  ) : (
                    users.map(u => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border transition-colors ${selectedUserId === u.id ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted/50'}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar || undefined} />
                          <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        {selectedUserId === u.id && <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assign Veterinarians (Minimum 2)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 border rounded-md bg-muted/20">
                  {vets.map(vet => (
                    <div
                      key={vet.id}
                      onClick={() => toggleVetSelection(vet.id)}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border transition-colors ${selectedVetIds.includes(vet.id) ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted/50'}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{vet.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{vet.specialization}</p>
                      </div>
                      {selectedVetIds.includes(vet.id) && <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handlePromote} 
                disabled={isSubmitting || !selectedUserId || selectedVetIds.length < 2}
              >
                {isSubmitting ? "Saving..." : "Save Receptionist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {receptionists.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">No receptionists found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              You haven't assigned the receptionist role to any users yet. Adding a receptionist helps manage vet schedules and appointments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {receptionists.map((rec) => (
            <Card key={rec.id} className="relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={rec.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10">{getInitials(rec.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{rec.name}</CardTitle>
                      <CardDescription className="text-xs">{rec.email}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDemote(rec.id)}
                    title="Remove Receptionist Role"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Assigned Doctors ({rec.assignedVetIds?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {rec.assignedVetIds?.map(vetId => {
                      const vet = vets.find(v => v.id === vetId);
                      return vet ? (
                        <span key={vet.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground font-medium">
                          {vet.name.replace('Dr. ', '')}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
