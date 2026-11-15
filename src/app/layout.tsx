import type { Metadata } from "next";
import "./local-fonts.css";
import "./globals.css";
import { PageLoadIndicator } from "./page-load-indicator";
import { FloatingBookingLink } from "./floating-booking-link";
import { Toaster } from "@/components/ui/toaster";

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
        className="__variable_7d8ea8 __variable_272bb5 __variable_d5df83 __variable_e1c765 antialiased bg-background text-foreground"
      >
        <PageLoadIndicator />
        {children}
        <FloatingBookingLink />
        <Toaster />
      </body>
    </html>
  );
}
