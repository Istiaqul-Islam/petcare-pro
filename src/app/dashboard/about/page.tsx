"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PawPrint,
  Heart,
  Shield,
  Users,
  Clock,
  Award,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PublicStats {
  totalUsers: number;
  totalPets: number;
  totalVets: number;
  avgRating: number;
}

export default function AboutPage() {
  const [statsData, setStatsData] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/public/stats");
        if (response.ok) {
          const data = (await response.json()) as { stats?: PublicStats };
          setStatsData(data.stats || null);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
    }
    return num.toString();
  };

  const features = [
    {
      icon: PawPrint,
      title: "Pet Management",
      description:
        "Create detailed profiles for all your pets with photos, medical history, and important documents.",
    },
    {
      icon: Clock,
      title: "Appointment Scheduling",
      description:
        "Book appointments with top veterinarians and manage your pet's healthcare schedule effortlessly.",
    },
    {
      icon: Shield,
      title: "Vaccination Tracking",
      description:
        "Never miss a vaccination with our smart reminder system and comprehensive health records.",
    },
    {
      icon: Users,
      title: "Social Community",
      description:
        "Connect with fellow pet lovers, share stories, photos, and get advice from experienced owners.",
    },
    {
      icon: Heart,
      title: "Health Monitoring",
      description:
        "Track your pet's health metrics, weight, and medical history all in one place.",
    },
    {
      icon: Award,
      title: "Expert Network",
      description:
        "Access to certified veterinarians and pet care specialists for professional guidance.",
    },
  ];

  const team = [
    {
      name: "Md Atik Ishrak",
      title: "Lecturer",
      dept: "Dept. of Computer Science and Engineering",
      role: "Mentor",
      image: "/atik.jpg",
    },
    {
      name: "Istiaqul Islam Ifti",
      title: "CSE 031 08169",
      dept: "Dept. of Computer Science and Engineering",
      role: "Designer & Developer",
      image: "/istiaq.jpeg",
    },
    {
      name: "Pushpita Dey",
      title: "CSE 031 08170",
      dept: "Dept. of Computer Science and Engineering",
      role: "Designer & Developer",
      image: "/puspita.jpg",
    },
    {
      name: "Tasmia Habib",
      title: "CSE 031 08199",
      dept: "Dept. of Computer Science and Engineering",
      role: "Designer & Developer",
      image: "/tasmia.jpg",
    },
  ];

  const stats = [
    {
      value: statsData ? formatNumber(statsData.totalUsers) : "12345+",
      label: "Happy Pet Owners",
    },
    {
      value: statsData ? formatNumber(statsData.totalVets) : "12345+",
      label: "Partner Veterinarians",
    },
    {
      value: statsData ? formatNumber(statsData.totalPets) : "12345+",
      label: "Pet Protected",
    },
    {
      value: statsData ? `${statsData.avgRating.toFixed(1)}/5.0` : "4.5/5.0",
      label: "User Satisfaction",
    },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto">
        <Badge variant="secondary" className="mb-4">
          About Us
        </Badge>
        <h1 className="text-4xl font-bold mb-4">We Care About Your Pets</h1>
        <p className="text-lg text-muted-foreground">
          PetCare Pro is dedicated to making pet care easier, smarter, and more
          connected. Our mission is to help pet owners provide the best possible
          care for their furry, feathered, and scaly friends.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-6 text-center">
              {loading ? (
                <div className="h-12 flex flex-col items-center justify-center space-y-2">
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-primary">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">What We Offer</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="bg-muted/30 -mx-4 md:-mx-6 px-4 md:px-6 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground">
            We believe every pet deserves the best care possible. That&apos;s
            why we built PetCare Pro - to empower pet owners with the tools and
            resources they need to keep their pets healthy, happy, and safe.
            From vaccination reminders to connecting with veterinarians,
            we&apos;re here to support you every step of the way.
          </p>
        </div>
      </section>

      {/* Values */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Compassion", desc: "We treat every pet like family" },
            { title: "Innovation", desc: "Constantly improving our platform" },
            { title: "Trust", desc: "Your data is safe with us" },
          ].map((value, i) => (
            <Card key={i}>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-primary mb-4" />
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Team */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">Meet Our Team</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {team.map((member, i) => (
            <Card key={i} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-muted/20">
              <CardContent className="pt-8 text-center space-y-4">
                <div className="relative mx-auto h-32 w-32 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  {member.title && (
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">{member.title}</p>
                  )}
                  {"dept" in member && (
                    <p className="text-[10px] text-muted-foreground font-medium">{member.dept}</p>
                  )}
                </div>
                <Badge variant="secondary" className="px-4 py-1 rounded-full font-bold">
                  {member.role}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Get In Touch</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Have questions or feedback? We&apos;d love to hear from you!
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm">admin@petcare.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm">+8801234-567890</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">PCIU, Chattogram</span>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="https://petcare-pro.pages.dev">
                  <Twitter className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="https://petcare-pro.pages.dev">
                  <Github className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="https://petcare-pro.pages.dev">
                  <Linkedin className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Version */}
      <div className="text-center text-sm text-muted-foreground">
        <p>PetCare Pro v1.0.0</p>
        <p>© {new Date().getFullYear()} PetCare Pro. All rights reserved.</p>
      </div>
    </div>
  );
}
