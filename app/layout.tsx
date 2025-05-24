import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inked",
  description: "Generate custom stickers with AI and order them in bulk",
  generator: "v0.dev",
  icons: {
    icon: "/icon.png",
  },
  other: {
    "google-fonts":
      "https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap",
    "google-fonts-preconnect": [
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
