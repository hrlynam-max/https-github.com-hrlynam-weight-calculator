import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  weight: ['400', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Axle & GVWR Compliance Check — 99lifts",
  description: "Free DOT weight compliance calculator for trucks with mounted forklifts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlowCondensed.className} ${ibmPlexMono.className} ${ibmPlexSans.className}`}>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
