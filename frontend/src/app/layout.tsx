import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stocko — O Fantasy Stock Market",
  description:
    "Escolhe 5 acções, acumula pontos, sobe de tier. O jogo de bolsa mais viciante de Portugal.",
  keywords: ["stocko", "fantasy", "bolsa", "acções", "jogo", "stocks", "portugal"],
  openGraph: {
    title: "Stocko — O Fantasy Stock Market",
    description: "Escolhe 5 acções, acumula pontos, sobe de tier.",
    url: "https://stocko.pt",
    siteName: "Stocko",
    locale: "pt_PT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stocko — O Fantasy Stock Market",
    description: "Escolhe 5 acções, acumula pontos, sobe de tier.",
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
