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
  title: "トリエル | ペットサロン向け収益改善SaaS",
  description: "ペットサロン向け収益改善SaaS。空き枠が出たら常連さんに LINE で自動オファー。1件埋まれば月額の元が取れる。",
  openGraph: {
    title: "トリエル | ペットサロン向け収益改善SaaS",
    description: "ペットサロン向け収益改善SaaS。空き枠が出たら常連さんに LINE で自動オファー。1件埋まれば月額の元が取れる。",
    siteName: "トリエル",
  },
  twitter: {
    title: "トリエル | ペットサロン向け収益改善SaaS",
    description: "ペットサロン向け収益改善SaaS。空き枠が出たら常連さんに LINE で自動オファー。1件埋まれば月額の元が取れる。",
  },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
