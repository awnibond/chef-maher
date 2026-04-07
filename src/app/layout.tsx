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
  title: "Chef Maher’s Yummy Corner",
  description:
    "A fun little neighborhood food menu made with love by Chef Maher. Order yummy dishes, send support messages, and cheer for our little chef!",
  openGraph: {
    title: "Chef Maher’s Yummy Corner",
    description:
      "A fun little neighborhood food menu made with love by Chef Maher. Order yummy dishes, send support messages, and cheer for our little chef!",
    url: "https://chef-maher.vercel.app",
    siteName: "Chef Maher’s Yummy Corner",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chef Maher’s Yummy Corner",
    description:
      "A fun little neighborhood food menu made with love by Chef Maher. Order yummy dishes, send support messages, and cheer for our little chef!",
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
