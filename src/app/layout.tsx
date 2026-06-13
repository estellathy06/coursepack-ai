import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoursePack AI - Turn Course Files Into Exam Study Packs",
  description: "Upload your course syllabus, lecture slides, notes, and rubrics. Get a comprehensive, source-grounded exam study pack with concept maps, active recall, practice quizzes, and a 7-day cram plan in minutes.",
  keywords: ["study pack", "exam prep", "cram sheet", "active recall quiz", "college exam prep", "syllabus converter"],
  authors: [{ name: "CoursePack AI Team" }],
  openGraph: {
    title: "CoursePack AI - Turn Course Files Into Exam Study Packs",
    description: "Upload your syllabus, notes, and rubrics. Get a complete 7-day study plan and exam guide in minutes.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-600 flex flex-col antialiased selection:bg-blue-500/10 selection:text-blue-600">
        {children}
      </body>
    </html>
  );
}
