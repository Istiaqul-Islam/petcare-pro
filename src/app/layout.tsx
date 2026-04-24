import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PetCare Pro - Comprehensive Pet Care Management",
    template: "%s | PetCare Pro",
  },
  description: "Manage your pets' health, appointments, vaccinations, and connect with other pet lovers. Professional pet care management system for modern pet owners.",
  keywords: ["Pet Care", "Veterinary", "Pet Management", "Pet Health", "Vaccination", "Appointments", "Pet Social", "AI Pet Assistant"],
  authors: [{ name: "PetCare Pro Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "PetCare Pro - Comprehensive Pet Care Management",
    description: "Professional pet care management system for modern pet owners",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
