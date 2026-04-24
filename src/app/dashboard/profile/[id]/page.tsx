"use client";

export const runtime = "edge";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  MessageSquare,
  Heart,
  PawPrint,
  ShieldCheck,
  Globe,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Pet {
  name: string;
  species: string;
  image: string | null;
}

interface PublicUser {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  address: string | null;
  role: string;
  showPets: number;
  showEmail: number;
  createdAt: string;
  updatedAt: string;
  pets?: Pet[];
  _count: {
    posts: number;
    pets: number;
  };
  recentPosts: any[];
}

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/${id}`);
      const data = (await response.json()) as any;
      if (data.success) {
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40 col-span-2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">User not found</h2>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* Cover/Header Section */}
      <Card className="overflow-hidden border-none shadow-xl rounded-3xl bg-linear-to-br from-primary/5 to-primary/10">
        <div className="h-32 bg-primary/20 relative" />
        <CardContent className="relative px-6 pb-6">
          <div className="absolute -top-16 left-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-2xl">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback className="text-4xl">
                {user.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="pt-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight">
                  {user.name || "Anonymous User"}
                </h1>
                {user.role === "admin" && (
                  <Badge className="bg-primary/20 text-primary border-primary/20">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Admin
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Globe className="h-3 w-3" /> Public Profile
              </p>
            </div>

            <div className="flex gap-2">
              <div className="text-center px-4 py-2 bg-background rounded-2xl border shadow-sm">
                <p className="text-xl font-bold">{user._count.posts}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Posts
                </p>
              </div>
              <div className="text-center px-4 py-2 bg-background rounded-2xl border shadow-sm">
                <p className="text-xl font-bold">{user._count.pets}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Pets
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="rounded-2xl shadow-md border-none">
            <CardHeader pb-0>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                About
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
              {user.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User's Pets Section */}
          <Card className="rounded-2xl shadow-md border-none overflow-hidden">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <PawPrint className="h-4 w-4" /> Pets
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {user.showPets === 1 ? (
                <div className="space-y-4">
                  {user.pets && user.pets.length > 0 ? (
                    user.pets.map((pet, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                      >
                        <Avatar className="h-12 w-12 rounded-xl border-2 border-primary/10 group-hover:border-primary/30 transition-all">
                          <AvatarImage src={pet.image || ""} />
                          <AvatarFallback>{pet.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{pet.name}</p>
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 py-0"
                          >
                            {pet.species}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-center text-muted-foreground py-4 italic">
                      No pets added yet.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 space-y-2 opacity-60">
                  <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    List is Private
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content (Posts) */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="bg-muted/50 p-1 rounded-2xl w-full justify-start gap-2 h-auto">
              <TabsTrigger
                value="posts"
                className="rounded-xl px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Posts
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="rounded-xl px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Contact
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6 space-y-6">
              {user.recentPosts.length > 0 ? (
                user.recentPosts.map((post: any) => (
                  <Card
                    key={post.id}
                    className="border-none shadow-sm rounded-2xl p-4 hover:shadow-md transition-all"
                  >
                    {post.content && (
                      <p className="mb-4 text-card-foreground leading-relaxed">
                        {post.content}
                      </p>
                    )}
                    {post.images?.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden mb-4">
                        {post.images
                          .slice(0, 4)
                          .map((img: string, i: number) => (
                            <img
                              key={i}
                              src={img}
                              className="h-32 w-full object-cover"
                            />
                          ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {post._count.likes} Likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />{" "}
                        {post._count.comments} Comments
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                  <p className="text-muted-foreground font-medium">
                    No posts shared yet.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <Card className="rounded-2xl shadow-sm border-none p-6">
                <h3 className="font-bold mb-4">Contact Information</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Contact info is only visible if the user has made it public.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Email
                      </p>
                      <p className="font-medium">
                        {user.email || "Not shared"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
