import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ServerAuthProvider } from "@/components/server-auth-provider";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
  title: "Skill Evo Marketplace — AI agent Skills, discovered and shared",
  description:
    "Discover, install, and publish reusable Skills for AI agents. Built by the community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ServerAuthProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          {/* Umami Analytics (self-hosted, Kurt team) */}
          {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
            <Script
              strategy="afterInteractive"
              src="https://stats.kina.men/script.js"
              data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            />
          )}
          <ConvexClientProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ConvexClientProvider>
        </body>
      </html>
    </ServerAuthProvider>
  );
}
