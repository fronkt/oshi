import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Bricolage_Grotesque,
  Noto_Sans_JP,
} from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});
const notoJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "700"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oshi.app"),
  title: "Oshi - Airbuds for anime",
  description:
    "See what your friends are watching, how closely your taste matches, and log your next episode in one tap. Oshi is the social layer for anime.",
  openGraph: {
    title: "Oshi - Airbuds for anime",
    description:
      "The social layer for anime. Friends' activity, taste-match scores, and one-tap logging.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oshi - Airbuds for anime",
    description: "The social layer for anime.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} ${notoJP.variable} antialiased`}
    >
      <body className="min-h-[100dvh] bg-ink text-paper">{children}</body>
    </html>
  );
}
