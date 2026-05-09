"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import gsap from "gsap";
import { auth } from "@/lib/firebase";
import {
  PawPrint,
  LayoutDashboard,
  Calendar,
  Syringe,
  Users,
  Bot,
  MessageSquare,
  Info,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  User,
  Shield,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: string;
  isVerified: number;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pets", label: "My Pets", icon: PawPrint },
  { href: "/dashboard/appointments", label: "Appointments", icon: Calendar },
  { href: "/dashboard/vaccinations", label: "Vaccinations", icon: Syringe },
  { href: "/dashboard/social", label: "Social", icon: Users },
  { href: "/dashboard/ai-bot", label: "AI Assistant", icon: Bot },
  { href: "/dashboard/predictor", label: "Disease Predictor", icon: Stethoscope },
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/dashboard/about", label: "About", icon: Info },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, []);

  // GSAP animations
  useEffect(() => {
    if (!mounted || loading) return;

    // Sidebar animations
    gsap.fromTo(
      ".sidebar-logo",
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }
    );

    gsap.fromTo(
      ".sidebar-logo-icon",
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)", delay: 0.2 }
    );

    gsap.fromTo(
      ".sidebar-logo-text",
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", delay: 0.4 }
    );

    gsap.fromTo(
      ".sidebar-nav-item",
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        delay: 0.6
      }
    );

    // Header animations
    gsap.fromTo(
      ".header-user-menu",
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)", delay: 0.8 }
    );

    // Interactive hover effects
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    navItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        gsap.to(item, {
          x: 5,
          duration: 0.2,
          ease: "power2.out"
        });
      });
      
      item.addEventListener('mouseleave', () => {
        if (!item.classList.contains('bg-primary')) {
          gsap.to(item, {
            x: 0,
            duration: 0.2,
            ease: "power2.out"
          });
        }
      });
    });

    // User menu hover effect
    const userMenu = document.querySelector('.header-user-menu');
    if (userMenu) {
      userMenu.addEventListener('mouseenter', () => {
        gsap.to(userMenu, {
          scale: 1.05,
          duration: 0.2,
          ease: "power2.out"
        });
      });
      
      userMenu.addEventListener('mouseleave', () => {
        gsap.to(userMenu, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out"
        });
      });
    }

    // Logo hover effect
    const logo = document.querySelector('.sidebar-logo');
    if (logo) {
      logo.addEventListener('mouseenter', () => {
        gsap.to('.sidebar-logo-icon', {
          rotation: 10,
          scale: 1.1,
          duration: 0.3,
          ease: "power2.out"
        });
      });
      
      logo.addEventListener('mouseleave', () => {
        gsap.to('.sidebar-logo-icon', {
          rotation: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    }

    return () => {
      gsap.killTweensOf(".sidebar-logo, .sidebar-logo-icon, .sidebar-logo-text, .sidebar-nav-item, .header-user-menu");
    };
  }, [mounted, loading]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = (await response.json()) as { user?: User };
        const userData = data.user || null;
        setUser(userData);
        
        // --- VERIFICATION CHECK ---
        // If user is not verified, redirect to pending page
        // (Except if they are already on the pending page)
        if (userData && userData.isVerified === 0 && pathname !== "/auth/verification-pending") {
          router.push("/auth/verification-pending");
        }
      } else {
        router.push("/auth/login");
      }
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Sign out from Firebase client
      const { signOut } = await import("firebase/auth");
      await signOut(auth);

      // 2. Sign out from our backend session
      await fetch("/api/auth/logout", { method: "POST" });
      
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
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

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b bg-muted/30">
        <Link href="/" className="flex items-center gap-3 group sidebar-logo">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform sidebar-logo-icon">
            <PawPrint className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight sidebar-logo-text">PetCare Pro</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 sidebar-nav-item",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1",
              )}
            >
              <Icon className={cn("h-5 w-5 sidebar-nav-icon", isActive ? "text-primary-foreground" : "text-primary/70")} />
              {item.label}
            </Link>
          );
        })}
        {(user?.role === "receptionist" || user?.role === "admin") && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Staff Portal
            </p>
            <Link
              href="/dashboard/receptionist"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                pathname.startsWith("/dashboard/receptionist")
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1",
              )}
            >
              <Shield className={cn("h-5 w-5", pathname.startsWith("/dashboard/receptionist") ? "text-primary-foreground" : "text-primary/70")} />
              Receptionist Panel
            </Link>
          </div>
        )}
      </nav>

      {/* User section in sidebar (mobile) */}
      <div className="p-4 border-t lg:hidden">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user?.name || null)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-sidebar/50 backdrop-blur-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b glass">
          <div className="flex h-16 items-center gap-4 px-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1">{/* Page title can be added here */}</div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Notifications */}
              <NotificationDropdown />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 header-user-menu"
                  >
                    <Avatar className="h-8 w-8 header-user-avatar">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(user?.name || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start header-user-info">
                      <span className="text-sm font-medium">
                        {user?.name || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user?.role}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 hidden md:block header-user-chevron" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
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
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>

        {/* Footer */}
        <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PetCare Pro. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
