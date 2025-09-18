import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hustle",
  description: "Habit tracker, daily tasks, and AI insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0b12] text-gray-100">
        {children}
      </body>
    </html>
  );
}
