import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { PageLoadIndicator } from "./page-load-indicator";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-wellness",
  display: "swap",
});

export const metadata: Metadata = {
  title: "New City Acupuncture & Wellness Center | Personalized Holistic Care",
  description:
    "New City Acupuncture & Wellness Center offers personalized acupuncture and holistic care for pain, stress, and better health in New City, NY.",
  keywords: [
    "acupuncture",
    "holistic care",
    "wellness",
    "New City NY",
    "Chinese medicine",
    "cupping",
    "herbal medicine",
  ],
  authors: [{ name: "New City Acupuncture & Wellness Center" }],
  openGraph: {
    title: "New City Acupuncture & Wellness Center",
    description:
      "Personalized acupuncture and holistic care for pain, stress, and better health in New City, NY.",
    siteName: "New City Acupuncture & Wellness Center",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "New City Acupuncture & Wellness Center",
    description:
      "Personalized acupuncture and holistic care for pain, stress, and better health in New City, NY.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${dmSans.variable} antialiased bg-background text-foreground`}
      >
        <PageLoadIndicator />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
