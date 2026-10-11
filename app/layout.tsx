import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import NavBar from "./components/NavBar";
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
  title: "MentorHub",
  description: "1-on-1 mentorship, free video calls",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <Suspense fallback={<div className="border-b h-14" />}>
            <NavBar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Suspense fallback={null}>
            <CallRequestLayer />
          </Suspense>
        </ToastProvider>
      </body>
    </html>
  );
}
