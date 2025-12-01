// app/layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils"; // Import hàm 'cn'
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider
import { Toaster } from "@/components/ui/sonner"; // Import Toaster
import { Header } from "@/components/header"; // Import Header
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JQK Study - Nền tảng học tập trực tuyến",
  description: "Xây dựng bởi JQK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geistSans.variable // Áp dụng biến font
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative flex min-h-dvh flex-col">
              <Header />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </AuthProvider>

          <Toaster position="top-right" richColors closeButton duration={3000} />
        </ThemeProvider>
      </body>
    </html>
  );
}