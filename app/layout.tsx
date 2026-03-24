import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wholesale.luckybeepress.com"),
  title: {
    default: "Lucky Bee Press Wholesale",
    template: "%s | Lucky Bee Press Wholesale",
  },
  description:
    "Wholesale ordering for Lucky Bee Press letterpress stationery. Premium hand-printed greeting cards for retail buyers.",
  keywords: [
    "wholesale",
    "greeting cards",
    "letterpress",
    "stationery",
    "Lucky Bee Press",
    "artisan cards",
  ],
  openGraph: {
    title: "Lucky Bee Press Wholesale",
    description:
      "Wholesale ordering for Lucky Bee Press letterpress stationery. Premium hand-printed greeting cards for retail buyers.",
    type: "website",
    siteName: "Lucky Bee Press Wholesale",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucky Bee Press Wholesale",
    description:
      "Wholesale ordering for Lucky Bee Press letterpress stationery. Premium hand-printed greeting cards for retail buyers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} antialiased`}>{children}</body>
    </html>
  );
}
