import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = "https://stocko.pt";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Stocko — O Fantasy Stock Market",
    template: "%s | Stocko",
  },
  description:
    "Escolhe 5 acções, acumula pontos, sobe de tier. O jogo de bolsa mais viciante de Portugal.",
  keywords: ["stocko", "fantasy", "bolsa", "acções", "jogo", "stocks", "portugal", "investimento"],
  authors: [{ name: "Stocko" }],
  creator: "Stocko",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Stocko — O Fantasy Stock Market",
    description: "Escolhe 5 acções, acumula pontos, sobe de tier. O jogo de bolsa mais viciante de Portugal.",
    url: BASE_URL,
    siteName: "Stocko",
    locale: "pt_PT",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stocko — O Fantasy Stock Market",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stocko — O Fantasy Stock Market",
    description: "Escolhe 5 acções, acumula pontos, sobe de tier.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
