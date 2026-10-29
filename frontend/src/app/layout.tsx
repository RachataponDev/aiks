import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { PrivacyConsentModal } from "@/components/PrivacyConsentModal";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LXVII | Hospitality Intelligence & Operations Hub",
  description: "LXVII - Premium restaurant dining, kitchen waste management, real-time recipe BOM cost tracking, and data quality intelligence.",
  keywords: [
    "LXVII",
    "LXVII Restaurant",
    "LXVII Bangkok",
    "Hospitality Intelligence",
    "Kitchen Waste Management",
    "Recipe BOM",
    "Inventory Intelligence",
    "Restaurant Operations"
  ],
  authors: [{ name: "Rdev (rachatapon.dev)", url: "https://rachatapon.dev" }],
  creator: "Rachatapon Chaemsai",
  publisher: "LXVII Hospitality",
  metadataBase: new URL("https://rachatapon.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LXVII | Hospitality Intelligence & Operations Hub",
    description: "LXVII - Premium dining, live flash deals, and zero-waste operational intelligence.",
    url: "https://rachatapon.dev",
    siteName: "LXVII",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LXVII | Hospitality Intelligence & Operations Hub",
    description: "LXVII - Premium dining, live flash deals, and zero-waste operational intelligence.",
    creator: "@rachatapon",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLdRestaurant = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Restaurant",
        "@id": "https://rachatapon.dev/#restaurant",
        "name": "LXVII",
        "alternateName": "LXVII Bangkok",
        "description": "LXVII is a premier dining destination offering handcrafted Thai & French cafe classics, real-time in-store flash passes, and sustainable culinary operations.",
        "url": "https://rachatapon.dev",
        "telephone": "+66 934741115",
        "email": "chaemsai_r@silpakorn.edu",
        "servesCuisine": ["Thai", "French", "Cafe", "Bakery"],
        "priceRange": "$$",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "88 Charoen Krung Rd, Bangkok Riverside",
          "addressLocality": "Bangkok",
          "postalCode": "10120",
          "addressCountry": "TH"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "07:00",
            "closes": "22:00"
          },
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Saturday", "Sunday"],
            "opens": "06:30",
            "closes": "23:00"
          }
        ],
        "founder": {
          "@type": "Person",
          "name": "Rachatapon Chaemsai",
          "alternateName": "Rdev",
          "jobTitle": "Lead Web & System Developer",
          "affiliation": "BIM Silpakorn University",
          "email": "chaemsai_r@silpakorn.edu",
          "url": "https://rachatapon.dev"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://rachatapon.dev/#system",
        "name": "LXVII Operations Hub",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Kitchen waste reduction, relational database integrity audit, and automated operational solutions for hospitality businesses.",
        "author": {
          "@type": "Person",
          "name": "Rachatapon Chaemsai",
          "url": "https://rachatapon.dev"
        }
      }
    ]
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdRestaurant) }}
        />
      </head>
      <body className="bg-white text-zinc-900 antialiased font-sans">
        {children}
        <PrivacyConsentModal />
        <Toaster
          position="bottom-right"
          theme="light"
          toastOptions={{
            style: {
              borderRadius: "4px",
              boxShadow: "none",
              border: "1px solid #e4e4e7",
              fontFamily: "var(--font-inter)",
            },
          }}
        />
      </body>
    </html>
  );
}
