import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blaze — Prompt to Cinematic Site",
  description:
    "Prompt-to-code site builder for cinematic, scroll-driven, 3D landing pages. Drag 3D models onto the real rendered page in the studio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-blaze-bg text-blaze-text antialiased">
        {children}
      </body>
    </html>
  );
}
