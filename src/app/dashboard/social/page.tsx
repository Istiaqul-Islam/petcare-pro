"use client";

export const runtime = "edge";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import {
  Heart,
  MessageCircle,
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  MoreHorizontal,
  Trash2,
  Clock,
  Loader2,
  Users,
  Reply,
  ThumbsUp,
  Laugh,
  Sparkles,
  Frown,
  Heart as CareIcon,
  Maximize2,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import {
  REACTION_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE,
  MAX_VIDEO_SIZE,
} from "@/lib/constants";

interface User {
  id: string;
  name: string | null;
  avatar: string | null;
  role?: string;
}

interface Post {
  id: string;
  userId: string;
  content: string;
  images: string[];
  videos: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: User;
  isLiked: boolean;
  userReaction: string | null;
  _count: {
    likes: number;
    comments: number;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  postId: string;
  parentId: string | null;
  userId: string;
  reactionsCount: number;
  userReaction: string | null;
  repliesCount: number;
  user: User;
  replies?: Comment[];
}

export default function SocialPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<
    { url: string; type: "image" | "video" }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    users: any[];
    posts: any[];
  }>({ users: [], posts: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: "image" | "video" }>({ url: "", type: "image" });

  // Comments state
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Current user
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 1) {
        performSearch();
      } else {
        setSearchResults({ users: [], posts: [] });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (posts.length > 0) {
      gsap.fromTo(
        ".post-card-container",
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          overwrite: "auto",
        }
      );
    }
  }, [posts.length]);

  useEffect(() => {
    if (!loading) {
      // Header animations
      gsap.fromTo(
        ".social-header",
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      );

      gsap.fromTo(
        ".social-subtitle",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "power2.out" }
      );

      // Post creation area animations
      gsap.fromTo(
        ".post-creation-area",
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, delay: 0.4, ease: "back.out(1.7)" }
      );

      gsap.fromTo(
        ".post-textarea",
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6, delay: 0.6, ease: "power2.out" }
      );

      gsap.fromTo(
        ".post-actions",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.8, ease: "power2.out" }
      );

      // Tabs animations
      gsap.fromTo(
        ".social-tabs",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 1.0, ease: "power2.out" }
      );

      gsap.fromTo(
        ".social-tab-trigger",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "back.out(1.7)",
          delay: 1.2
        }
      );

      // Empty state animations
      if (posts.length === 0) {
        gsap.fromTo(
          ".empty-social-state",
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, delay: 1.4, ease: "power2.out" }
        );

        gsap.fromTo(
          ".empty-social-icon",
          { scale: 0, rotation: -180 },
          { scale: 1, rotation: 0, duration: 0.8, delay: 1.6, ease: "back.out(1.7)" }
        );
      }

      // Interactive hover effects
      const postCards = document.querySelectorAll('.post-card-container');
      postCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -8,
            scale: 1.02,
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      // Post textarea focus effect
      const postTextarea = document.querySelector('.post-textarea');
      if (postTextarea) {
        postTextarea.addEventListener('focus', () => {
          gsap.to('.post-creation-area', {
            scale: 1.02,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        postTextarea.addEventListener('blur', () => {
          gsap.to('.post-creation-area', {
            scale: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      }

      // Post button hover effect
      const postButton = document.querySelector('.post-button');
      if (postButton) {
        postButton.addEventListener('mouseenter', () => {
          gsap.to(postButton, {
            scale: 1.05,
            y: -2,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        postButton.addEventListener('mouseleave', () => {
          gsap.to(postButton, {
            scale: 1,
            y: 0,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      }

      // Tab hover effects
      const tabTriggers = document.querySelectorAll('.social-tab-trigger');
      tabTriggers.forEach(tab => {
        tab.addEventListener('mouseenter', () => {
          gsap.to(tab, {
            scale: 1.05,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        tab.addEventListener('mouseleave', () => {
          gsap.to(tab, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      });

      // Media preview items animations
      const mediaPreviewItems = document.querySelectorAll('.media-preview-item');
      gsap.fromTo(
        ".media-preview-item",
        { opacity: 0, scale: 0.8, rotation: -5 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: "back.out(1.7)",
          delay: 1.0
        }
      );

      // Remove media button interactions
      const removeMediaButtons = document.querySelectorAll('.remove-media-button');
      removeMediaButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
          gsap.to(button, {
            scale: 1.3,
            rotation: 90,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        button.addEventListener('mouseleave', () => {
          gsap.to(button, {
            scale: 1,
            rotation: 0,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      });

      // Like button interactions
      const likeButtons = document.querySelectorAll('.like-button');
      likeButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
          gsap.to(button, {
            scale: 1.2,
            rotation: 5,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        button.addEventListener('mouseleave', () => {
          gsap.to(button, {
            scale: 1,
            rotation: 0,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      });

      // Comment button interactions
      const commentButtons = document.querySelectorAll('.comment-button');
      commentButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
          gsap.to(button, {
            scale: 1.1,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        button.addEventListener('mouseleave', () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      });

      return () => {
        gsap.killTweensOf(".social-header, .social-subtitle, .post-creation-area, .post-textarea, .post-actions, .social-tabs, .social-tab-trigger, .empty-social-state, .empty-social-icon, .post-card-container, .post-button, .like-button, .comment-button, .media-preview-item, .remove-media-button");
      };
    }
  }, [loading, posts.length]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const resp = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`,
      );
      const data = (await resp.json()) as any;
      if (data.success) {
        setSearchResults({ users: data.users || [], posts: data.posts || [] });
      }
    } catch (e) {
    } finally {
      setIsSearching(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = (await response.json()) as any;
        setCurrentUser(data.user || null);
      }
    } catch (e) {}
  };

  const fetchPosts = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`);
      const data = (await response.json()) as any;
      if (data.success) {
        if (pageNum === 1) setPosts(data.posts || []);
        else setPosts((prev) => [...prev, ...(data.posts || [])]);
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Limits validation
    if (type === "image" && file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "Image too large (max 5MB)",
        variant: "destructive",
      });
      return;
    }
    if (type === "video" && file.size > MAX_VIDEO_SIZE) {
      toast({
        title: "Error",
        description: "Video too large (max 10MB)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as any;
      if (data.success) {
        setSelectedMedia((prev) => [
          ...prev,
          { url: data.url, type: data.type || type },
        ]);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const createPost = async () => {
    if (!newPostContent.trim() && selectedMedia.length === 0) return;
    setCreatingPost(true);
    try {
      const images = selectedMedia
        .filter((m) => m.type === "image")
        .map((m) => m.url);
      const videos = selectedMedia
        .filter((m) => m.type === "video")
        .map((m) => m.url);

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPostContent, images, videos }),
      });
      const data = (await response.json()) as any;
      if (data.success) {
        setPosts((prev) => [data.post, ...prev]);
        setNewPostContent("");
        setSelectedMedia([]);
        toast({ title: "Posted!", description: "Your post is now live." });
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setCreatingPost(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        toast({ title: "Deleted", description: "Post removed successfully" });
      }
    } catch (e) {}
  };

  const toggleReaction = async (
    postId: string,
    type: string,
    isComment = false,
    commentId?: string,
  ) => {
    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: isComment ? undefined : postId,
          commentId: isComment ? commentId : undefined,
          type,
        }),
      });
      const data = (await response.json()) as any;

      if (data.success) {
        if (isComment) {
          setComments((prev) =>
            updateCommentsWithReaction(
              prev,
              commentId!,
              data.reacted ? type : null,
              data.reacted,
            ),
          );
        } else {
          setPosts((prev) =>
            prev.map((p) => {
              if (p.id === postId) {
                const wasReacted = !!p.userReaction;
                const isNowReacted = data.reacted;
                let newCount = p._count.likes;
                if (!wasReacted && isNowReacted) newCount++;
                else if (wasReacted && !isNowReacted) newCount--;

                return {
                  ...p,
                  userReaction: isNowReacted ? type : null,
                  isLiked: isNowReacted,
                  _count: { ...p._count, likes: newCount },
                };
              }
              return p;
            }),
          );
        }
      }
    } catch (e) {}
  };

  const updateCommentsWithReaction = (
    comments: Comment[],
    id: string,
    type: string | null,
    reacted: boolean,
  ): Comment[] => {
    return comments.map((c) => {
      if (c.id === id) {
        const wasReacted = !!c.userReaction;
        let newCount = c.reactionsCount;
        if (!wasReacted && reacted) newCount++;
        else if (wasReacted && !reacted) newCount--;
        return { ...c, userReaction: type, reactionsCount: newCount };
      }
      if (c.replies)
        return {
          ...c,
          replies: updateCommentsWithReaction(c.replies, id, type, reacted),
        };
      return c;
    });
  };

  const openCommentsDialog = async (postId: string) => {
    setSelectedPostId(postId);
    setCommentsDialogOpen(true);
    fetchComments(postId);
  };

  const fetchComments = async (postId: string, pId?: string) => {
    setLoadingComments(true);
    try {
      const url = `/api/comments?postId=${postId}${pId ? `&parentId=${pId}` : ""}`;
      const response = await fetch(url);
      const data = (await response.json()) as any;
      if (data.success) {
        if (pId) {
          setComments((prev) => addRepliesToComment(prev, pId, data.comments));
        } else {
          setComments(data.comments);
        }
      }
    } finally {
      setLoadingComments(false);
    }
  };

  const addRepliesToComment = (
    comments: Comment[],
    pId: string,
    replies: Comment[],
  ): Comment[] => {
    return comments.map((c) => {
      if (c.id === pId) return { ...c, replies };
      if (c.replies)
        return { ...c, replies: addRepliesToComment(c.replies, pId, replies) };
      return c;
    });
  };

  const submitComment = async () => {
    if (!newComment.trim() || !selectedPostId) return;
    setSubmittingComment(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: selectedPostId,
          content: newComment,
          parentId: replyingTo?.id,
        }),
      });
      const data = (await response.json()) as any;
      if (data.success) {
        if (replyingTo) {
          setComments((prev) => addNewReply(prev, replyingTo.id, data.comment));
        } else {
          setComments((prev) => [data.comment, ...prev]);
        }
        setNewComment("");
        setReplyingTo(null);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPostId
              ? {
                  ...p,
                  _count: { ...p._count, comments: p._count.comments + 1 },
                }
              : p,
          ),
        );
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const addNewReply = (
    comments: Comment[],
    pId: string,
    reply: Comment,
  ): Comment[] => {
    return comments.map((c) => {
      if (c.id === pId)
        return {
          ...c,
          replies: [reply, ...(c.replies || [])],
          repliesCount: c.repliesCount + 1,
        };
      if (c.replies)
        return { ...c, replies: addNewReply(c.replies, pId, reply) };
      return c;
    });
  };

  const deleteComment = async (id: string, postId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      const response = await fetch(`/api/comments?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setComments((prev) => removeCommentById(prev, id));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  _count: { ...p._count, comments: p._count.comments - 1 },
                }
              : p,
          ),
        );
        toast({ title: "Deleted", description: "Comment removed" });
      }
    } catch (e) {}
  };

  const removeCommentById = (comments: Comment[], id: string): Comment[] => {
    return comments
      .filter((c) => c.id !== id)
      .map((c) =>
        c.replies ? { ...c, replies: removeCommentById(c.replies, id) } : c,
      );
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor(
      (new Date().getTime() - new Date(dateStr).getTime()) / 1000,
    );
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const openLightbox = (url: string, type: "image" | "video" = "image") => {
    setLightboxMedia({ url, type });
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 mt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent social-header">
            Social
          </h1>
          <p className="text-muted-foreground text-sm font-medium italic social-subtitle">
            Share your pet's life with the world
          </p>
        </div>
        <div className="relative w-full md:w-64 group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="Find people or posts..."
            className="pl-10 rounded-2xl bg-muted/30 border-none shadow-sm focus-visible:ring-primary/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {(searchQuery.length > 1 || isSearching) && (
            <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-2xl rounded-2xl border-primary/10 overflow-hidden backdrop-blur-xl bg-background/95">
              <ScrollArea className="max-h-100">
                <div className="p-2 space-y-4">
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    </div>
                  ) : (
                    <>
                      {searchResults.users.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 mb-2">
                            People
                          </p>
                          {searchResults.users.map((u) => (
                            <Link
                              key={u.id}
                              href={`/dashboard/profile/${u.id}`}
                              className="flex items-center gap-3 p-2 hover:bg-primary/5 rounded-xl transition-colors"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={u.avatar} />
                                <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold">{u.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {u.role}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.posts.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 mb-2">
                            Posts
                          </p>
                          {searchResults.posts.map((p) => (
                            <Link
                              key={p.id}
                              href={`/dashboard/social?postId=${p.id}`}
                              className="flex flex-col gap-1 p-2 hover:bg-primary/5 rounded-xl transition-colors"
                            >
                              <p className="text-sm line-clamp-2">
                                {p.content}
                              </p>
                              <p className="text-[10px] text-primary font-bold">
                                by {p.user_name}
                              </p>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.users.length === 0 &&
                        searchResults.posts.length === 0 && (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            No results found for "{searchQuery}"
                          </div>
                        )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      </div>

      {/* Create Post */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-lg post-creation-area animate-fade-in">
        <CardContent className="p-5">
          <div className="flex gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={currentUser?.avatar || ""} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {currentUser?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea
                placeholder="What's happening in your pet's world?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-25 border-none focus-visible:ring-0 bg-muted/30 rounded-xl p-4 text-base post-textarea animate-grow-in"
              />

              {selectedMedia.length > 0 && (
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 animate-fade-in">
                  {selectedMedia.map((m, i) => (
                    <div key={i} className="relative group shrink-0 media-preview-item">
                      {m.type === "image" && (
                        <img
                          src={m.url}
                          className="h-24 w-24 object-cover rounded-lg border shadow-sm"
                        />
                      )}
                      {m.type === "video" && (
                        <video
                          src={m.url}
                          playsInline
                          className="h-24 w-24 object-cover rounded-lg border shadow-sm"
                        />
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full remove-media-button"
                        onClick={() => removeMedia(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-muted post-actions">
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, "image")}
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    className="hidden"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, "video")}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <VideoIcon className="h-5 w-5" />
                  </Button>
                </div>
                <Button
                  onClick={createPost}
                  disabled={
                    creatingPost ||
                    uploading ||
                    (!newPostContent.trim() && selectedMedia.length === 0)
                  }
                  className="rounded-full px-6 bg-primary hover:bg-primary/90"
                >
                  {creatingPost ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center space-y-4 empty-social-state">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/30 empty-social-icon" />
            <p className="text-muted-foreground text-lg">
              No posts yet. Be the first to share!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onDelete={() => deletePost(post.id)}
              onReact={(type: string) => toggleReaction(post.id, type)}
              onComment={() => openCommentsDialog(post.id)}
              formatTime={formatTimeAgo}
              onImageClick={(url: string) => openLightbox(url, "image")}
              onVideoClick={(url: string) => openLightbox(url, "video")}
              className="post-card-container"
              likeButtonClass="like-button"
              commentButtonClass="comment-button"
            />
          ))
        )}

        {hasMore && (
            <div className="pt-10 pb-20 text-center">
                <Button 
                    onClick={() => {
                        setLoadingMore(true);
                        const nextPage = Math.ceil(posts.length / 10) + 1;
                        fetchPosts(nextPage);
                    }} 
                    disabled={loadingMore}
                    size="lg"
                    className="rounded-full px-12 bg-primary/10 text-primary hover:bg-primary hover:text-white font-black shadow-xl border-none transition-all"
                >
                    {loadingMore ? (
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    ) : (
                        "Browse More Stories"
                    )}
                </Button>
            </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
          <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center">
            {lightboxMedia.type === "image" ? (
              <img
                src={lightboxMedia.url}
                alt=""
                className="max-w-full max-h-[85vh] object-contain"
              />
            ) : (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <DialogTitle className="text-xl">Comments</DialogTitle>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 pb-20">
              {comments.length === 0 && !loadingComments && (
                <p className="text-center text-muted-foreground py-10">
                  No comments yet.
                </p>
              )}
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  onReact={(type: string) =>
                    toggleReaction("", type, true, comment.id)
                  }
                  onReply={() => {
                    setReplyingTo(comment);
                    document.getElementById("comment-input")?.focus();
                  }}
                  onDelete={() => deleteComment(comment.id, comment.postId)}
                  formatTime={formatTimeAgo}
                  fetchReplies={() => fetchComments(comment.postId, comment.id)}
                />
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 border-t bg-background/80 backdrop-blur-md sticky bottom-0">
            {replyingTo && (
              <div className="mb-2 flex items-center justify-between bg-muted/50 p-2 rounded-lg text-sm">
                <span className="text-muted-foreground">
                  Replying to{" "}
                  <span className="font-semibold text-primary">
                    {replyingTo.user.name}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                id="comment-input"
                placeholder={
                  replyingTo ? "Write a reply..." : "Add a comment..."
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && submitComment()
                }
                className="rounded-full bg-muted/50 border-none focus-visible:ring-1"
              />
              <Button
                size="icon"
                onClick={submitComment}
                disabled={!newComment.trim() || submittingComment}
                className="rounded-full bg-primary h-10 w-10 shrink-0"
              >
                {submittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostCard({
  post,
  currentUser,
  onDelete,
  onReact,
  onComment,
  formatTime,
  onImageClick,
  onVideoClick,
  className,
}: any) {
  const [showPicker, setShowPicker] = useState(false);
  const isOwner = currentUser?.id === post.userId;
  const isAdmin = currentUser?.role === "admin";
  const canDelete = isOwner || isAdmin;

  const getReactionIcon = (type: string | null) => {
    const r = REACTION_TYPES.find((t) => t.type === type);
    return r ? <span className="mr-1">{r.emoji}</span> : null;
  };

  return (
    <Card className={`border-none shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 ${className || ""}`}>
      <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/profile/${post.userId}`}>
            <Avatar className="h-10 w-10 border border-primary/10 shadow-sm cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={post.user.avatar || ""} />
              <AvatarFallback>{post.user.name?.[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/dashboard/profile/${post.userId}`}>
              <h3 className="font-semibold text-sm leading-tight hover:underline cursor-pointer">
                {post.user.name}
              </h3>
            </Link>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-medium">
              <Clock className="h-3 w-3" />
              {formatTime(post.createdAt)}
            </p>
          </div>
        </div>
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-4">
        {post.content && (
          <p className="text-base text-card-foreground leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Media Rendering */}
        <div className="space-y-2">
          {post.images?.length > 0 && (
            <div
              className={`grid gap-2 overflow-hidden rounded-2xl ${post.images.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {post.images.map((url: string, i: number) => (
                <div
                  key={i}
                  className="relative group overflow-hidden cursor-zoom-in"
                  onClick={() => onImageClick(url)}
                >
                  <img
                    src={url}
                    className={`w-full object-cover shadow-inner hover:scale-105 transition-transform duration-500 ${post.images.length === 1 ? "max-h-125" : "h-48"}`}
                    alt=""
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Maximize2 className="h-8 w-8 text-white scale-0 group-hover:scale-100 transition-transform duration-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {post.videos?.map((url: string, i: number) => (
            <div key={i} className="relative group cursor-zoom-in" onClick={() => onVideoClick(url)}>
              <video
                src={url}
                controls
                playsInline
                className="w-full rounded-2xl shadow-md bg-black"
              />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/50 text-white border-none hover:bg-black/70">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <DropdownMenu open={showPicker} onOpenChange={setShowPicker}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`h-9 rounded-full px-4 gap-2 transition-all group ${post.userReaction ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted font-medium"}`}
                    onMouseEnter={() => setShowPicker(true)}
                  >
                    {getReactionIcon(post.userReaction) || (
                      <Heart className="h-4 w-4 group-hover:scale-125 transition-transform" />
                    )}
                    <span>{post._count.likes || 0}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="flex p-1 gap-1 rounded-full px-2 shadow-2xl bg-background/95 backdrop-blur-md border-primary/20 animate-in zoom-in-50"
                  onMouseLeave={() => setShowPicker(false)}
                >
                  {REACTION_TYPES.map((r) => (
                    <Button
                      key={r.type}
                      variant="ghost"
                      onClick={() => {
                        onReact(r.type);
                        setShowPicker(false);
                      }}
                      className="h-10 w-10 text-xl hover:scale-125 hover:bg-primary/10 transition-all p-0 rounded-full"
                      title={r.label}
                    >
                      {r.emoji}
                    </Button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              variant="ghost"
              onClick={onComment}
              className="h-9 rounded-full px-4 gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post._count.comments || 0}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentItem({
  comment,
  currentUser,
  onReact,
  onReply,
  onDelete,
  formatTime,
  fetchReplies,
}: any) {
  const [showReplies, setShowReplies] = useState(false);
  const [reactionPicker, setReactionPicker] = useState(false);
  const isAdmin = currentUser?.role === "admin";
  const isOwner = currentUser?.id === comment.userId;
  const canDelete = isOwner || isAdmin;

  const toggleReplies = () => {
    if (!showReplies && !comment.replies) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  return (
    <div className="flex gap-3 group animate-in fade-in duration-300">
      <Link href={`/dashboard/profile/${comment.userId}`}>
        <Avatar className="h-8 w-8 shrink-0 border border-primary/5 cursor-pointer hover:opacity-80">
          <AvatarImage src={comment.user.avatar || ""} />
          <AvatarFallback>{comment.user.name?.[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 space-y-2">
        <div className="bg-muted/30 p-3 rounded-2xl relative shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Link href={`/dashboard/profile/${comment.userId}`}>
              <h4 className="font-bold text-xs text-primary/80 hover:underline cursor-pointer">
                {comment.user.name}
              </h4>
            </Link>
            <span className="text-[10px] text-muted-foreground font-medium uppercase">
              {formatTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-card-foreground leading-snug">
            {comment.content}
          </p>

          {comment.reactionsCount > 0 && (
            <div className="absolute -bottom-2 -right-1 bg-background border border-primary/10 shadow-lg rounded-full px-1.5 py-0.5 flex items-center gap-1 z-10 scale-90 origin-right">
              <span className="text-[10px] font-bold text-primary">
                {comment.reactionsCount}
              </span>
              <Heart className="h-2.5 w-2.5 fill-primary text-primary" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-5 ml-1">
          <DropdownMenu open={reactionPicker} onOpenChange={setReactionPicker}>
            <DropdownMenuTrigger asChild>
              <button
                className={`text-xs font-bold transition-colors ${comment.userReaction ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {comment.userReaction ? "Reacted" : "React"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="flex p-0.5 gap-0.5 rounded-full px-1 shadow-lg animate-in zoom-in-75"
            >
              {REACTION_TYPES.map((r) => (
                <Button
                  key={r.type}
                  variant="ghost"
                  onClick={() => {
                    onReact(r.type);
                    setReactionPicker(false);
                  }}
                  className="h-7 w-7 text-sm p-0 m-0 rounded-full hover:bg-primary/10"
                >
                  {r.emoji}
                </Button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={onReply}
            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>

          {canDelete && (
            <button
              onClick={onDelete}
              className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>

        {comment.repliesCount > 0 && (
          <button
            onClick={toggleReplies}
            className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline pl-1 transition-all"
          >
            <span className="h-px w-4 bg-primary/30" />
            {showReplies
              ? "Hide replies"
              : `View ${comment.repliesCount} replies`}
          </button>
        )}

        {showReplies && comment.replies && (
          <div className="space-y-4 pt-2 pl-4 border-l-2 border-primary/10 animate-in slide-in-from-left-2 duration-300">
            {comment.replies.map((reply: any) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                onReact={(type: string) => onReact(type, reply.id)}
                onReply={() => onReply(reply)}
                onDelete={() => onDelete(reply.id)}
                formatTime={formatTime}
                fetchReplies={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
