import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/LangContext";
import { NavBar } from "@/components/LangToggle";

export const metadata: Metadata = {
  title: "123MOG",
  description: "Track your daily meals and nutrition",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <LangProvider>
          <NavBar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </LangProvider>
      </body>
    </html>
  );
}
