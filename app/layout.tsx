import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';

// Optimize metadata with caching hints
export const metadata: Metadata = {
  title: "OpenForum",
  description: "A modern open-source forum platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "OpenForum",
    description: "A modern open-source forum platform",
    type: "website",
    locale: "en_US",
    siteName: "OpenForum",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenForum",
    description: "A modern open-source forum platform",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  },
};

// Add viewport configuration for better performance
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased w-full h-[100dvh] bg-background flex flex-col items-center justify-start p-0 m-0 dark`}
      >
        {children}
        <Toaster position="top-right" duration={5000} swipeDirections={["top", "left"]} />
        <SpeedInsights />
      </body>
    </html>
  );
}
