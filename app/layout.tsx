import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auth Gateway",
  description: "Enterprise Single Sign-On Server",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider telemetry={false}>
      <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
        <body
          suppressHydrationWarning
          className={`${inter.className} ${inter.variable} antialiased bg-[#f0f2f5]`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
