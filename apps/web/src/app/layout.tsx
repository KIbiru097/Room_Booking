import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Suspense } from "react"
import NavBar from "@/components/NavBar"
import Footer from "@/components/Footer"
import { NavigationProgressBar } from "@/components/NavigationProgressBar"
import AIChat from "@/components/AIChat"
import PwaRegistration from "@/components/PwaRegistration"
import { AppProviders } from "@/providers/AppProviders"

export const metadata: Metadata = {
  title: {
    default: "LuxStay — Curated Stays & Grand Resorts",
    template: "%s | LuxStay",
  },
  description:
    "Experience extraordinary luxury hospitality, curated boutique suites, and five-star grand resorts with LuxStay. Instant confirmation and transparent pricing.",
  keywords: [
    "luxury hotels",
    "five star hotel booking",
    "boutique resorts",
    "LuxStay hospitality",
    "executive suites",
    "Ethiopia travel companion",
  ],
  authors: [{ name: "LuxStay Global" }],
  creator: "LuxStay",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "LuxStay",
    title: "LuxStay — Curated Stays & Grand Resorts",
    description:
      "Experience extraordinary luxury hospitality, boutique suites, and grand resorts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LuxStay — Curated Stays & Grand Resorts",
    description:
      "Experience extraordinary luxury hospitality, boutique suites, and grand resorts.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icons/luxstay-192.svg",
        type: "image/svg+xml",
        sizes: "192x192",
      },
      {
        url: "/icons/luxstay-512.svg",
        type: "image/svg+xml",
        sizes: "512x512",
      },
    ],
    apple: "/icons/luxstay-192.svg",
  },
  appleWebApp: {
    capable: true,
    title: "LuxStay",
    statusBarStyle: "black-translucent",
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1528",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('luxstay-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();" +
              "(function(){try{var l=localStorage.getItem('luxstay_lang');if(l==='am'||l==='en'){document.documentElement.lang=l;document.documentElement.dir='ltr';}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-screen bg-[#f3efe5] text-[#182333] font-sans selection:bg-[#e4bd55]/30 selection:text-[#0b1528]">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <AppProviders>
          <PwaRegistration />
          <NavBar />
          <main className="pt-18">{children}</main>
          <Footer />
          <AIChat />
        </AppProviders>
      </body>
    </html>
  )
}
