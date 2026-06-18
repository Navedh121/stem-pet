// Root layout — wraps every page in the app.
// Sets up fonts, metadata, and the dark background.

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STEMPet — Your child's math progress, at a glance",
  description:
    "STEMPet is an adaptive math toy for kids aged 6–12. This parent dashboard shows your child's progress in real time.",
  keywords: ["math", "kids", "education", "adaptive learning", "STEM"],
  // Open Graph preview when sharing the URL
  openGraph: {
    title: "STEMPet",
    description: "See your child's math progress grow.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // "dark" class enables Tailwind dark-mode utilities.
    // Font class names are handled by globals.css @import, so no
    // next/font/google is needed here.
    <html lang="en" className="dark">
      <body className="bg-ink text-paper antialiased">
        {children}
      </body>
    </html>
  );
}
