"use client";

export const runtime = "edge";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Star,
  Clock,
  CheckCircle,
  Eye,
  Send,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface FeedbackItem {
  id: string;
  rating: number;
  category: string;
  subject: string | null;
  message: string;
  status: string;
  adminResponse: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

export default function AdminFeedbackPage() {
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [search]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/feedback");
      if (response.ok) {
        const data = (await response.json()) as { feedbacks?: FeedbackItem[] };
        setFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedFeedback || !adminResponse.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/feedback/${selectedFeedback.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminResponse, status: "reviewed" }),
      });

      if (response.ok) {
        toast({
          title: "Response sent",
          description: "Your response has been saved.",
        });
        setResponseDialogOpen(false);
        fetchFeedback();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback? This will also remove its impact on the average rating.")) return;

    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Feedback deleted",
          description: "The feedback has been permanently removed.",
        });
        fetchFeedback();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feedback",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredFeedbacks = feedbacks.filter((f) =>
    f.message.toLowerCase().includes(search.toLowerCase()) ||
    f.user.email.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Feedback</h1>
          <p className="text-muted-foreground">Manage user feedback and support</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search feedback..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No feedback found</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="space-y-4 pr-4">
            {filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {feedback.user.name?.charAt(0) || feedback.user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{feedback.user.name || feedback.user.email}</h3>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < feedback.rating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <Badge className={getStatusColor(feedback.status)}>
                          {feedback.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Badge variant="outline">{feedback.category}</Badge>
                        <span>•</span>
                        <span>{formatDate(feedback.createdAt)}</span>
                      </div>
                      <p className="text-sm">{feedback.message}</p>
                      {feedback.adminResponse && (
                        <div className="mt-3 p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Admin Response:</p>
                          <p className="text-sm">{feedback.adminResponse}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFeedback(feedback);
                          setAdminResponse(feedback.adminResponse || "");
                          setResponseDialogOpen(true);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(feedback.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
            <DialogDescription>
              From: {selectedFeedback?.user.name || selectedFeedback?.user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm">{selectedFeedback?.message}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Response</label>
              <Textarea
                placeholder="Write your response..."
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={saving || !adminResponse.trim()}>
              {saving ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
