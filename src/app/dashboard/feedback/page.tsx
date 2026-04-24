"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, Clock, CheckCircle, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUS } from "@/lib/constants";

interface Feedback {
  id: string;
  rating: number;
  category: string;
  subject: string | null;
  message: string;
  status: string;
  adminResponse: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export default function FeedbackPage() {
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [successMessage, setSuccessMessage] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = (await res.json()) as { feedbacks?: Feedback[] };
        setFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    }
    
    if (!category) {
      newErrors.category = "Please select a category";
    }
    
    if (!message.trim()) {
      newErrors.message = "Message is required";
    } else if (message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          category,
          subject: subject.trim() || null,
          message,
        }),
      });
      
      const data = (await res.json()) as { success?: boolean; error?: string };
      
      if (res.ok && data.success) {
        toast({
          title: "Feedback submitted",
          description: "Thank you for your feedback! We appreciate your input.",
        });
        
        // Reset form
        setRating(0);
        setCategory("");
        setSubject("");
        setMessage("");
        setErrors({});
        setSuccessMessage(true);
        
        // Refresh feedback list
        fetchFeedbacks();
        
        // Hide success message after 5 seconds
        setTimeout(() => setSuccessMessage(false), 5000);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to submit feedback",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submit feedback error:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = FEEDBACK_STATUS.find((s) => s.value === status);
    const colorMap: Record<string, string> = {
      yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    
    return (
      <Badge 
        className={colorMap[statusConfig?.color || "yellow"]}
        variant="secondary"
      >
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getCategoryLabel = (cat: string) => {
    const categoryConfig = FEEDBACK_CATEGORIES.find((c) => c.value === cat);
    return categoryConfig?.label || cat;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "reviewed":
        return <Eye className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const renderStars = (value: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            } transition-transform duration-150`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          >
            <Star
              className={`h-6 w-6 ${
                star <= (interactive && hoveredRating > 0 ? hoveredRating : value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback</h1>
        <p className="text-muted-foreground">
          We value your feedback. Help us improve PetCare Pro!
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Submit Feedback
            </CardTitle>
            <CardDescription>
              Share your thoughts, report issues, or suggest new features
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage && (
              <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Thank you for your feedback!</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your submission has been received and will be reviewed by our team.
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating */}
              <div className="space-y-2">
                <Label className="text-foreground">
                  Rating <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  {renderStars(rating, true)}
                  {rating > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </span>
                  )}
                </div>
                {errors.rating && (
                  <p className="text-sm text-destructive">{errors.rating}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-foreground">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label className="text-foreground">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {subject.length}/100 characters (optional)
                </p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-foreground">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your feedback in detail..."
                  rows={5}
                  maxLength={1000}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{message.length}/1000 characters</span>
                  <span>Minimum 10 characters required</span>
                </div>
                {errors.message && (
                  <p className="text-sm text-destructive">{errors.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Previous Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Your Previous Feedback</CardTitle>
            <CardDescription>
              Track the status of your submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedbacks.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No feedback submitted yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your feedback history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {renderStars(fb.rating)}
                      </div>
                      {getStatusBadge(fb.status)}
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {getCategoryLabel(fb.category)}
                      </span>
                    </div>
                    
                    {fb.subject && (
                      <h4 className="font-medium text-foreground mb-1">
                        {fb.subject}
                      </h4>
                    )}
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {fb.message}
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getStatusIcon(fb.status)}
                      <span>{formatDate(fb.createdAt)}</span>
                    </div>
                    
                    {/* Admin Response */}
                    {fb.adminResponse && (
                      <div className="mt-3 p-3 bg-primary/10 dark:bg-primary/20 rounded-md border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary">
                            Admin Response
                          </span>
                          {fb.reviewedAt && (
                            <span className="text-xs text-muted-foreground">
                              • {formatDate(fb.reviewedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">
                          {fb.adminResponse}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
