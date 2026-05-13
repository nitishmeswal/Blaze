import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blaze — Cinematic Site Builder",
  description:
    "Cinematic kit + visual coordinate / motion-path planner for 3D + GSAP landing pages.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-blaze-bg text-blaze-text antialiased">
        {children}
      </body>
    </html>
  );
}
