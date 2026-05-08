"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import {
  Bot,
  Send,
  Sparkles,
  MessageSquare,
  Clock,
  PawPrint,
  Stethoscope,
  Calendar,
  Heart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "What vaccinations does my puppy need?",
  "How often should I groom my cat?",
  "Signs of illness in dogs?",
  "Best diet for senior pets?",
];

const features = [
  {
    icon: Stethoscope,
    title: "Health Advice",
    description: "Get general health guidance for your pets",
  },
  {
    icon: Calendar,
    title: "Care Scheduling",
    description: "Help with appointment and vaccination planning",
  },
  {
    icon: Heart,
    title: "Behavior Tips",
    description: "Understand your pet's behavior better",
  },
];

export default function AIBotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Initial GSAP animations (Mount only)
  useEffect(() => {
    // Header animations
    gsap.fromTo(
      ".ai-header",
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
    );

    gsap.fromTo(
      ".ai-header-icon",
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 0.8, delay: 0.2, ease: "back.out(1.7)" }
    );

    // Chat area animations
    gsap.fromTo(
      ".chat-area",
      { opacity: 0, x: -50, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.7, delay: 0.4, ease: "back.out(1.7)" }
    );

    // Empty state animations (if no messages)
    if (messages.length === 0) {
      gsap.fromTo(
        ".empty-state",
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.8, delay: 0.6, ease: "back.out(1.7)" }
      );

      gsap.fromTo(
        ".empty-state-icon",
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.8, delay: 0.8, ease: "back.out(1.7)" }
      );

      gsap.fromTo(
        ".empty-state-title",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 1.0, ease: "power2.out" }
      );

      gsap.fromTo(
        ".empty-state-description",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 1.2, ease: "power2.out" }
      );

      gsap.fromTo(
        ".suggested-question",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.7)",
          delay: 1.4
        }
      );
    }

    // Sidebar animations
    gsap.fromTo(
      ".features-card",
      { opacity: 0, x: 50, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.7, delay: 0.8, ease: "back.out(1.7)" }
    );

    gsap.fromTo(
      ".feature-item",
      { opacity: 0, x: 20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        delay: 1.0
      }
    );

    gsap.fromTo(
      ".recent-topics-card",
      { opacity: 0, x: 50, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.7, delay: 1.0, ease: "back.out(1.7)" }
    );

    gsap.fromTo(
      ".disclaimer-card",
      { opacity: 0, x: 50, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.7, delay: 1.2, ease: "back.out(1.7)" }
    );

    // Interactive hover effects
    const suggestedQuestionsNodes = document.querySelectorAll('.suggested-question');
    suggestedQuestionsNodes.forEach(question => {
      question.addEventListener('mouseenter', () => {
        gsap.to(question, { scale: 1.05, y: -2, duration: 0.2, ease: "power2.out" });
      });
      question.addEventListener('mouseleave', () => {
        gsap.to(question, { scale: 1, y: 0, duration: 0.2, ease: "power2.out" });
      });
    });

    const featureItemsNodes = document.querySelectorAll('.feature-item');
    featureItemsNodes.forEach(item => {
      item.addEventListener('mouseenter', () => {
        gsap.to(item, { x: 5, duration: 0.2, ease: "power2.out" });
      });
      item.addEventListener('mouseleave', () => {
        gsap.to(item, { x: 0, duration: 0.2, ease: "power2.out" });
      });
    });

    return () => {
      gsap.killTweensOf(".ai-header, .ai-header-icon, .chat-area, .empty-state, .empty-state-icon, .empty-state-title, .empty-state-description, .suggested-question, .features-card, .feature-item, .recent-topics-card, .disclaimer-card, .chat-input-container, .send-button");
    };
  }, []); // Only once on mount

  // Message specific GSAP animations
  useEffect(() => {
    if (messages.length > 0) {
      // Only animate the LATEST message container
      const latestMessage = document.querySelector('.message-container:last-child');
      if (latestMessage) {
        gsap.fromTo(
          latestMessage,
          { opacity: 0, y: 20, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" }
        );
      }
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = (await response.json()) as { response?: string };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I couldn't generate a response.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I'm having trouble connecting right now to provide a professional response. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 ai-header">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 ai-header-icon">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Pet Assistant
          </h1>
        </div>
      </div>

      <div className="flex-1 grid gap-6 lg:grid-cols-4 min-h-0">
        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col min-h-0 shadow-sm border-primary/5 chat-area">
          <CardContent className="flex-1 flex flex-col p-4 min-h-0 bg-muted/5 rounded-xl">
            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto pr-4 space-y-6"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 empty-state">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                    <Bot className="h-16 w-16 text-primary relative empty-state-icon" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 empty-state-title">
                    How can I assist you today?
                  </h3>
                  <p className="text-muted-foreground max-w-sm mb-8 empty-state-description">
                    Ask me about symptoms, vaccinations, or general pet
                    nutrition based on our expert knowledge base.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {suggestedQuestions.map((question, i) => (
                      <Button
                        key={i}
                        variant="secondary"
                        size="sm"
                        className="rounded-full px-4 hover:bg-primary/20 transition-all border border-transparent hover:border-primary/30 suggested-question"
                        onClick={() => handleSuggestedQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 message-container ${
                        message.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-9 w-9 shrink-0 border shadow-sm">
                        <AvatarFallback
                          className={
                            message.role === "assistant"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }
                        >
                          {message.role === "assistant" ? (
                            <Bot className="h-5 w-5" />
                          ) : (
                            <PawPrint className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-2xl px-4 py-3 max-w-[85%] shadow-sm overflow-hidden wrap-break-word ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-card border border-border rounded-tl-none"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0 text-foreground/90">
                                    {children}
                                  </p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-4 mb-2 space-y-1 text-foreground/90">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-4 mb-2 space-y-1 text-foreground/90">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="">{children}</li>
                                ),
                                //@ts-ignore
                                strong: ({ children }) => (
                                  <strong className="font-extrabold text-primary dark:text-green-400">
                                    {children}
                                  </strong>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-lg font-bold mb-2 text-foreground">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-md font-bold mb-2 text-foreground">
                                    {children}
                                  </h2>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                        <p
                          className={`text-[10px] mt-2 font-medium opacity-70 ${
                            message.role === "user"
                              ? "text-primary-foreground/90"
                              : "text-muted-foreground"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <Avatar className="h-9 w-9 shrink-0 border shadow-sm">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center justify-center">
                        <div className="flex gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-duration:0.8s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s] [animation-duration:0.8s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s] [animation-duration:0.8s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4 shrink-0 chat-input-container">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Ask me anything about pet care..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 chat-input"
                />
                <Button type="submit" disabled={loading || !input.trim()} className="send-button">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="features-card">
            <CardHeader>
              <CardTitle className="text-sm">What I Can Help With</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2 feature-item">
                  <feature.icon className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="recent-topics-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["Vaccinations", "Pet Nutrition", "Behavior Training"].map(
                  (topic, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() =>
                        setInput(`Tell me about ${topic.toLowerCase()}`)
                      }
                    >
                      {topic}
                    </Button>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 disclaimer-card">
            <CardContent className="pt-4">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Disclaimer:</strong> This AI assistant provides general
                information only. Always consult with a licensed veterinarian
                for specific medical advice.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
