import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { ToastProvider } from "./components/Toast";
import CallRequestLayer from "./components/CallRequestLayer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MentorHub — Free 1-on-1 advisors on video",
  description:
    "Book free 1-on-1 video sessions with advisors across careers, coding, design, business, wellbeing and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[color:var(--background)] text-[color:var(--foreground)]">
        <ToastProvider>
          <Suspense fallback={<div className="h-14 border-b" />}>
            <NavBar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <Suspense fallback={null}>
            <CallRequestLayer />
          </Suspense>
        </ToastProvider>
      </body>
    </html>
  );
}
