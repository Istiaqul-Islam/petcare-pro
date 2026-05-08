"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PawPrint,
  Calendar,
  Syringe,
  Users,
  Bot,
  MessageSquare,
  Shield,
  Heart,
  Stethoscope,
  Bell,
  Menu,
  X,
  Star,
  ArrowRight,
  Loader2,
  LayoutDashboard,
  User,
  LogOut,
  Settings,
  ChevronDown,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

// Feature icons mapping
const featureIcons = {
  PawPrint,
  Calendar,
  Syringe,
  Users,
  Bot,
  MessageSquare,
  Shield,
  Heart,
  Stethoscope,
  Bell,
};

interface User {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: string;
}

interface PublicStats {
  totalUsers: number;
  totalPets: number;
  totalVets: number;
  avgRating: number;
}

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Check if user is logged in
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      if (response.ok) {
        const data = (await response.json()) as { user?: Partial<User> };
        setUser((data.user as User) || null);
      }
    } catch {
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  // Fetch public stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/public/stats");
      if (response.ok) {
        const data = (await response.json()) as { stats?: PublicStats };
        setStats((data.stats as PublicStats) || null);
      }
    } catch {
      console.error("Failed to fetch stats");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    checkAuth();
    fetchStats();
  }, [checkAuth, fetchStats]);

  useEffect(() => {
    if (mounted) {
      gsap.registerPlugin(ScrollTrigger);

      // Hero animations
      const tl = gsap.timeline();

      // Background orb animations
      gsap.to(".hero-bg-orb-1", {
        x: 30,
        y: -30,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".hero-bg-orb-2", {
        x: -40,
        y: 40,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Hero text animations
      tl.fromTo(
        ".hero-badge",
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" },
      )
        .fromTo(
          ".hero-title",
          { opacity: 0, y: 50, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" },
          "-=0.4",
        )
        .fromTo(
          ".hero-description",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.6",
        )
        .fromTo(
          ".hero-buttons",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.4",
        );

      // Stats animations
      gsap.fromTo(
        ".stat-item",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".stats-container",
            start: "top 80%",
          },
        },
      );

      // Feature cards animations
      gsap.fromTo(
        ".feature-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".features-grid",
            start: "top 80%",
          },
        },
      );

      // About section animations
      gsap.fromTo(
        ".about-stat",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: "#about",
            start: "top 80%",
          },
        },
      );

      gsap.fromTo(
        ".about-feature",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".about-feature",
            start: "top 80%",
          },
        },
      );

      gsap.fromTo(
        ".about-value",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".about-value",
            start: "top 80%",
          },
        },
      );

      // Testimonials section animations
      gsap.fromTo(
        ".testimonial-card",
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#testimonials",
            start: "top 80%",
          },
        },
      );

      gsap.fromTo(
        ".testimonial-stars",
        { opacity: 0, scale: 0.5 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: "#testimonials",
            start: "top 70%",
          },
        },
      );

      gsap.fromTo(
        ".testimonial-avatar",
        { opacity: 0, scale: 0.8, rotation: -10 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".testimonial-author",
            start: "top 80%",
          },
        },
      );

      // CTA section animations
      gsap.fromTo(
        ".cta-card",
        { opacity: 0, scale: 0.9, y: 50 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cta-card",
            start: "top 80%",
          },
        },
      );

      gsap.fromTo(
        ".cta-title",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".cta-card",
            start: "top 70%",
          },
        },
      );

      gsap.fromTo(
        ".cta-description",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".cta-card",
            start: "top 70%",
          },
        },
      );

      gsap.fromTo(
        ".cta-button",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          delay: 0.4,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".cta-card",
            start: "top 70%",
          },
        },
      );

      // Footer section animations
      gsap.fromTo(
        ".footer-column",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "footer",
            start: "top 90%",
          },
        },
      );

      gsap.fromTo(
        ".footer-brand",
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "footer",
            start: "top 85%",
          },
        },
      );

      gsap.fromTo(
        ".footer-title",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "footer",
            start: "top 80%",
          },
        },
      );

      gsap.fromTo(
        ".footer-link",
        { opacity: 0, x: -10 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".footer-links",
            start: "top 85%",
          },
        },
      );

      gsap.fromTo(
        ".footer-copyright",
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".footer-copyright",
            start: "top 90%",
          },
        },
      );

      // Section header animations
      gsap.fromTo(
        ".section-badge",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".section-badge",
            start: "top 85%",
          },
        },
      );

      gsap.fromTo(
        ".section-title",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".section-title",
            start: "top 80%",
          },
        },
      );

      gsap.fromTo(
        ".section-description",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".section-description",
            start: "top 75%",
          },
        },
      );

      // Interactive element animations
      // Button hover effects
      const buttons = document.querySelectorAll(
        'button:not([variant="ghost"])',
      );
      buttons.forEach((button) => {
        button.addEventListener("mouseenter", () => {
          gsap.to(button, {
            scale: 1.05,
            duration: 0.2,
            ease: "power2.out",
          });
        });

        button.addEventListener("mouseleave", () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out",
          });
        });
      });

      // Card hover effects
      const cards = document.querySelectorAll(
        ".feature-card, .testimonial-card, .about-feature, .about-value",
      );
      cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, {
            y: -5,
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            duration: 0.3,
            ease: "power2.out",
          });
        });

        card.addEventListener("mouseleave", () => {
          gsap.to(card, {
            y: 0,
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            duration: 0.3,
            ease: "power2.out",
          });
        });
      });

      // Navigation link hover effects
      const navLinks = document.querySelectorAll("nav a");
      navLinks.forEach((link) => {
        link.addEventListener("mouseenter", () => {
          gsap.to(link, {
            x: 5,
            duration: 0.2,
            ease: "power2.out",
          });
        });

        link.addEventListener("mouseleave", () => {
          gsap.to(link, {
            x: 0,
            duration: 0.2,
            ease: "power2.out",
          });
        });
      });
    }
  }, [mounted]);

  // Mobile menu animations
  useEffect(() => {
    if (mobileMenuOpen) {
      // Animate menu opening
      gsap.fromTo(
        ".mobile-menu",
        { opacity: 0, height: 0 },
        { opacity: 1, height: "auto", duration: 0.3, ease: "power2.out" },
      );

      gsap.fromTo(
        ".mobile-nav-link",
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.1,
        },
      );

      gsap.fromTo(
        ".mobile-auth",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          delay: 0.3,
          ease: "power2.out",
        },
      );
    } else {
      // Animate menu closing
      gsap.to(".mobile-menu", {
        opacity: 0,
        height: 0,
        duration: 0.2,
        ease: "power2.in",
      });
    }
  }, [mobileMenuOpen]);

  // Performance optimizations and cleanup
  useEffect(() => {
    return () => {
      // Clean up GSAP animations on component unmount
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.killTweensOf("*");
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.refresh();
    } catch {
      console.error("Logout failed");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
    }
    return num.toString();
  };

  const features = [
    {
      icon: "PawPrint",
      title: "Pet Profiles",
      description:
        "Create detailed profiles for all your pets with photos, medical history, and vital information.",
    },
    {
      icon: "Calendar",
      title: "Appointments",
      description:
        "Book appointments with top veterinarians and manage your pet's healthcare schedule effortlessly.",
    },
    {
      icon: "Syringe",
      title: "Vaccination Tracking",
      description:
        "Never miss a vaccination with our smart reminder system and comprehensive health records.",
    },
    {
      icon: "Users",
      title: "Social Community",
      description:
        "Connect with fellow pet lovers, share stories, photos, and get advice from experienced owners.",
    },
    {
      icon: "Bot",
      title: "AI Assistant",
      description:
        "Get instant answers to your pet care questions powered by advanced AI technology.",
    },
    {
      icon: "Shield",
      title: "Secure & Private",
      description:
        "Your data is protected with enterprise-grade security and privacy measures.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Dog Owner",
      content:
        "PetCare Pro has completely transformed how I manage my dog's health. The vaccination reminders are a lifesaver!",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Cat Owner",
      content:
        "The social community feature helped me connect with other cat lovers and get valuable advice. Highly recommended!",
      rating: 5,
    },
    {
      name: "Emily Davis",
      role: "Multi-Pet Household",
      content:
        "Managing appointments for my 4 pets used to be a nightmare. Now it's incredibly simple with PetCare Pro.",
      rating: 5,
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

  if (!mounted || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PawPrint className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">PetCare Pro</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              /* Logged in user menu */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium">
                      {user.name || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/pets" className="cursor-pointer">
                      <PawPrint className="mr-2 h-4 w-4" />
                      My Pets
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Not logged in - show sign in/get started */
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background mobile-menu">
            <nav className="container mx-auto flex flex-col gap-2 p-4 mobile-nav">
              <a
                href="#features"
                className="text-sm font-medium py-2 mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-sm font-medium py-2 mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <a
                href="#about"
                className="text-sm font-medium py-2 mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              {user ? (
                <div className="flex flex-col gap-2 pt-4 border-t mt-2 mobile-auth">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full mobile-btn"
                  >
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full text-red-600 mobile-btn"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-4 border-t mt-2 mobile-auth">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full mobile-btn"
                  >
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-primary hover:bg-primary/90 mobile-btn"
                  >
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl hero-bg-orb hero-bg-orb-1" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl hero-bg-orb hero-bg-orb-2" />

        <div className="container mx-auto relative px-4 py-20 md:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <Badge
              variant="secondary"
              className="mb-4 px-4 py-1 hero-text hero-badge"
            >
              🐾 Trusted by {stats ? formatNumber(stats.totalUsers) : "10,000+"}{" "}
              pet owners
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 hero-text hero-title">
              Complete Pet Care
              <span className="text-primary block">Management System</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 hero-text hero-description">
              Manage your pets&apos; health, appointments, vaccinations, and
              connect with other pet lovers all in one place. Professional pet
              care made simple.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 hero-text hero-buttons">
              {user ? (
                <Button
                  size="lg"
                  asChild
                  className="bg-primary hover:bg-primary/90 text-lg px-8 hero-primary-btn"
                >
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  asChild
                  className="bg-primary hover:bg-primary/90 text-lg px-8 hero-primary-btn"
                >
                  <Link href="/auth/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-lg px-8 hero-secondary-btn"
              >
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Real Data */}
      <section className="border-y bg-muted/30 stats-container">
        <div className="container mx-auto px-4 py-12">
          {loadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center stat-item">
                  <Skeleton className="h-8 w-20 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center stat-item">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {stats ? formatNumber(stats.totalUsers) : "10,000+"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Happy Pet Owners
                </p>
              </div>
              <div className="text-center stat-item">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {stats ? formatNumber(stats.totalVets) : "500+"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Partner Veterinarians
                </p>
              </div>
              <div className="text-center stat-item">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {stats ? formatNumber(stats.totalPets) : "50,000+"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pet Protected
                </p>
              </div>
              <div className="text-center stat-item">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {stats ? `${stats.avgRating.toFixed(1)}/5.0` : "4.8/5.0"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  User Satisfaction
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 section-badge">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 section-title">
              Everything you need for pet care
            </h2>
            <p className="text-lg text-muted-foreground section-description">
              Our comprehensive suite of tools helps you manage every aspect of
              your pet&apos;s health and happiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 features-grid">
            {features.map((feature, i) => {
              const IconComponent =
                featureIcons[feature.icon as keyof typeof featureIcons] ||
                PawPrint;
              return (
                <Card
                  key={i}
                  className="feature-card group hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                >
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <IconComponent className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 section-badge">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 section-title">
              Loved by pet owners everywhere
            </h2>
            <p className="text-lg text-muted-foreground section-description">
              See what our community has to say about their experience with
              PetCare Pro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="bg-background testimonial-card">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4 testimonial-stars">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star
                        key={j}
                        className="h-4 w-4 fill-yellow-500 text-yellow-500"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 testimonial-content">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 testimonial-author">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center testimonial-avatar">
                      <span className="text-sm font-semibold text-primary">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4 section-badge">
              About Us
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 section-title">
              We Care About Your Pets
            </h2>
            <p className="text-lg text-muted-foreground section-description">
              PetCare Pro is dedicated to making pet care easier, smarter, and
              more connected. Our mission is to help pet owners provide the best
              possible care for their furry, feathered, and scaly friends.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center about-stat">
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {stats ? formatNumber(stats.totalUsers) : "10,000+"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Happy Pet Owners
              </p>
            </div>
            <div className="text-center about-stat">
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {stats ? formatNumber(stats.totalVets) : "500+"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Partner Veterinarians
              </p>
            </div>
            <div className="text-center about-stat">
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {stats ? formatNumber(stats.totalPets) : "50,000+"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Pet Protected
              </p>
            </div>
            <div className="text-center about-stat">
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {stats ? `${stats.avgRating.toFixed(1)}/5.0` : "4.8/5.0"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                User Satisfaction
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8 section-title">
              What We Offer
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
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
              ].map((feature, i) => (
                <Card key={i} className="about-feature">
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
          </div>

          {/* Mission */}
          <div className="bg-muted/30 rounded-lg p-8 md:p-12 mb-16">
            <div className="max-w-3xl mx-auto text-center">
              <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4 section-title">
                Our Mission
              </h3>
              <p className="text-muted-foreground">
                We believe every pet deserves the best care possible.
                That&apos;s why we built PetCare Pro - to empower pet owners
                with the tools and resources they need to keep their pets
                healthy, happy, and safe. From vaccination reminders to
                connecting with veterinarians, we&apos;re here to support you
                every step of the way.
              </p>
            </div>
          </div>

          {/* Team */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8 section-title">
              Meet Our Team
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {team.map((member, i) => (
                <Card key={i} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-muted/20 about-feature">
                  <CardContent className="pt-8 text-center space-y-4">
                    <div className="relative mx-auto h-32 w-32 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg">{member.name}</h4>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">{member.title}</p>
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
          </div>
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8 section-title">
              Our Values
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: "Compassion", desc: "We treat every pet like family" },
                {
                  title: "Innovation",
                  desc: "Constantly improving our platform",
                },
                { title: "Trust", desc: "Your data is safe with us" },
              ].map((value, i) => (
                <Card key={i} className="about-value">
                  <CardContent className="pt-6 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto text-primary mb-4" />
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {value.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact */}
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4 section-title">
                Get In Touch
              </h3>
              <p className="text-muted-foreground mb-6">
                Have questions or feedback? We&apos;d love to hear from you!
              </p>
              <div className="flex flex-wrap justify-center gap-6 mb-6">
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
                  <Link
                    href="https://petcare-pro.pages.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href="https://petcare-pro.pages.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href="https://petcare-pro.pages.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden cta-card">
            <div className="gradient-green p-8 md:p-16 text-center text-white cta-content">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 cta-title">
                Ready to give your pet the best care?
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8 cta-description">
                Join {stats ? formatNumber(stats.totalUsers) : "thousands of"}{" "}
                pet owners who trust PetCare Pro for their pet&apos;s health and
                happiness.
              </p>
              {user ? (
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="text-lg px-8 cta-button"
                >
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="text-lg px-8 cta-button"
                >
                  <Link href="/auth/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 footer-column">
              <Link
                href="/"
                className="flex items-center gap-2 mb-4 footer-brand"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <PawPrint className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold">PetCare Pro</span>
              </Link>
              <p className="text-muted-foreground max-w-sm footer-description">
                Comprehensive pet care management system for modern pet owners.
                Your pet&apos;s health, happiness, and community - all in one
                place.
              </p>
            </div>
            <div className="footer-column">
              <h4 className="font-semibold mb-4 footer-title">Quick Links</h4>
              <nav className="flex flex-col gap-2 footer-links">
                <a
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors footer-link"
                >
                  Features
                </a>
                <a
                  href="#testimonials"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors footer-link"
                >
                  Testimonials
                </a>
                <a
                  href="#about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors footer-link"
                >
                  About
                </a>
              </nav>
            </div>
            <div className="footer-column">
              <h4 className="font-semibold mb-4 footer-title">Account</h4>
              <nav className="flex flex-col gap-2 footer-links">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors footer-link"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors footer-link"
                    >
                      Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors footer-link"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors footer-link"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground footer-copyright">
            <p>
              &copy; {new Date().getFullYear()} PetCare Pro. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
