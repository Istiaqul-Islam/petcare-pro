"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users,
  Search,
  PawPrint,
  Calendar,
  MessageSquare,
  Shield,
  MoreHorizontal,
  Trash2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import gsap from "gsap";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  _count: {
    pets: number;
    appointments: number;
    posts: number;
  };
}

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers(0, true);
  }, [search]);

  // GSAP Animation when users update
  useEffect(() => {
    if (users.length > 0 && containerRef.current) {
      gsap.fromTo(
        ".user-card",
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          overwrite: "auto",
        },
      );
    }
  }, [users.length]);

  const fetchUsers = async (currentOffset: number, isNewSearch = false) => {
    if (isNewSearch) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(currentOffset));

      const response = await fetch(`/api/admin/users?${params}`);
      const data = (await response.json()) as any;

      if (data.success) {
        if (isNewSearch) {
          setUsers(data.users);
        } else {
          setUsers((prev) => [...prev, ...data.users]);
        }
        setTotal(data.total);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    fetchUsers(nextOffset);
  };

  const deleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this user and all their data?",
      )
    )
      return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as any;
      if (data.success) {
        setUsers(users.filter((u) => u.id !== userId));
        setTotal((prev) => prev - 1);
        toast({ title: "Success", description: "User deleted successfully" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 container max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            User Directory
          </h1>
          <p className="text-muted-foreground font-medium">
            Total registered members:{" "}
            <span className="text-foreground font-bold">{total}</span>
          </p>
        </div>
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
          <Users className="h-7 w-7 text-primary" />
        </div>
      </div>

      <div className="relative max-w-xl group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Lookup user by name or email..."
          className="pl-12 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/20 shadow-sm h-14 text-lg font-medium transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-3xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-muted/20">
          <CardContent className="py-24 text-center space-y-6">
            <div className="h-24 w-24 bg-background rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">No Users Found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                We couldn't find any members matching your search criteria. Try
                a different term.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            ref={containerRef}
          >
            {users.map((user) => (
              <Card
                key={user.id}
                className="user-card border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-card/40 backdrop-blur-sm border border-primary/5"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <Link href={`/dashboard/profile/${user.id}`}>
                      <Avatar className="h-16 w-16 border-4 border-background shadow-lg group-hover:scale-105 transition-transform">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="bg-primary/5 text-primary text-2xl font-black">
                          {user.name?.charAt(0) ||
                            user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-primary/10"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="rounded-2xl p-2 min-w-40 shadow-2xl border-none"
                      >
                        <DropdownMenuItem className="rounded-xl p-3 cursor-pointer group/item font-bold">
                          <Link
                            href={`/dashboard/profile/${user.id}`}
                            className="flex items-center w-full"
                          >
                            <ChevronRight className="h-4 w-4 mr-2 group-hover/item:translate-x-1 transition-transform" />{" "}
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/5 rounded-xl p-3 cursor-pointer font-bold"
                          onClick={() => deleteUser(user.id)}
                          disabled={user.role === "admin"}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-1 mb-6">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-xl truncate tracking-tight">
                        {user.name || "Mystery Member"}
                      </h3>
                      {user.role === "admin" && (
                        <div
                          className="h-2 w-2 rounded-full bg-primary animate-pulse"
                          title="Admin User"
                        />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate font-medium">
                      {user.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-4 border-t border-primary/5">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">
                        Pets
                      </p>
                      <p className="font-black text-lg">{user._count.pets}</p>
                    </div>
                    <div className="text-center border-x border-primary/5">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">
                        Posts
                      </p>
                      <p className="font-black text-lg">{user._count.posts}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">
                        Appts
                      </p>
                      <p className="font-black text-lg">
                        {user._count.appointments}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Badge
                      variant="secondary"
                      className="bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg px-2 shadow-none"
                    >
                      {user.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {total > users.length && (
            <div className="pt-12 text-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                size="lg"
                className="rounded-full px-16 h-14 font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all"
              >
                {loadingMore ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "Explore More Members"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
