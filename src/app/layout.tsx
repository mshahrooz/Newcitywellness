import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
