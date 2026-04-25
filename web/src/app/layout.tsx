import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400"
});

export const metadata: Metadata = {
  title: "Manger Maki - Knowledge Management Tool",
  description: "Organize, categorize, and search your notes, documents, and resources with Manger Maki. A powerful knowledge management platform for students, professionals, and lifelong learners.",
  keywords: ["knowledge management", "note taking", "document organization", "productivity tool"],
  authors: [{ name: "Manger Maki" }],
  metadataBase: new URL("https://praveen-tek.github.io/Manger-Maki"),
  openGraph: {
    title: "Manger Maki - Knowledge Management Tool",
    description: "Organize, categorize, and search your notes, documents, and resources with Manger Maki.",
    type: "website",
    locale: "en_US",
    url: "https://praveen-tek.github.io/Manger-Maki",
    siteName: "Manger Maki",
    images: [
      {
        url: "/Manger-Maki/manger-samo.png",
        width: 300,
        height: 300,
        alt: "Manger Maki Logo",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Manger Maki - Knowledge Management Tool",
    description: "Organize, categorize, and search your notes, documents, and resources with Manger Maki.",
    images: ["/Manger-Maki/manger-samo.png"],
  },
  robots: "index, follow",
  icons: {
    icon: "/Manger-Maki/favicon.ico",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        <meta charSet="UTF-8" />
        <link rel="canonical" href="https://praveen-tek.github.io/Manger-Maki" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}