import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { LangProvider } from "@/lib/LangContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { NavBar, BottomTabBar, FloatingLogButton } from "@/components/LangToggle";
import { RegisterSW } from "@/components/RegisterSW";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "123MOG",
  description: "Track your daily meals and nutrition",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "123MOG",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  // Lets safe-area-inset-* env() values resolve to the notch/home-indicator
  // insets instead of 0 - required for the bottom tab bar's own safe-area
  // padding to do anything on an iPhone with a home indicator.
  viewportFit: "cover",
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>
          <LangProvider>
            <ToastProvider>
              <RegisterSW />
              <NavBar />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 main-pad">
                {children}
              </main>
              <BottomTabBar />
              <FloatingLogButton />
            </ToastProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
