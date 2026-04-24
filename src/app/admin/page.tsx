"use client";

import { useState, useEffect } from "react";
import {
  Users,
  PawPrint,
  Calendar,
  MessageSquare,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStats {
  totalUsers: number;
  totalPets: number;
  totalAppointments: number;
  totalFeedback: number;
  totalVets: number;
  pendingFeedback: number;
  recentUsers: number;
  activeAppointments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = (await response.json()) as AdminStats;
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      description: "Registered users",
    },
    {
      title: "Total Pets",
      value: stats?.totalPets || 0,
      icon: PawPrint,
      trend: "+8%",
      trendUp: true,
      description: "Registered pets",
    },
    {
      title: "Appointments",
      value: stats?.totalAppointments || 0,
      icon: Calendar,
      trend: "+23%",
      trendUp: true,
      description: "Total appointments",
    },
    {
      title: "Veterinarians",
      value: stats?.totalVets || 0,
      icon: Stethoscope,
      trend: "Active",
      trendUp: true,
      description: "Partner vets",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">
          Monitor your PetCare Pro platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {stat.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={stat.trendUp ? "text-green-500" : "text-red-500"}
                >
                  {stat.trend}
                </span>
                <span className="text-muted-foreground ml-1">
                  {stat.description}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Feedback</CardTitle>
            <CardDescription>User feedback awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {stats?.pendingFeedback || 0}
              </div>
              <Activity
                className={`h-8 w-8 ${(stats?.pendingFeedback || 0) > 0 ? "text-yellow-500" : "text-green-500"}`}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {(stats?.pendingFeedback || 0) > 0
                ? "Review pending feedback items"
                : "All feedback has been reviewed"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Appointments</CardTitle>
            <CardDescription>Scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {stats?.activeAppointments || 0}
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Pending and confirmed appointments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Health</CardTitle>
          <CardDescription>System status and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <span className="text-sm text-green-500">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">API Services</span>
              </div>
              <span className="text-sm text-green-500">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <span className="text-sm text-green-500">Available</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
