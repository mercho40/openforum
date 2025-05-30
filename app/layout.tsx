import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: "OpenForum",
  description: "A modern open-source forum platform",
};

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
