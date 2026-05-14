import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Spotify Nebula | Your Music as a Galaxy",
  description: "Visualize your Spotify playlists as a 3D generative nebula based on audio features.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body style={{ backgroundColor: "#000", color: "#fff", margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
