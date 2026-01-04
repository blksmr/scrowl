import { Inter, Roboto_Mono } from "next/font/google";
import "@/styles/main.css";
import type { Viewport } from "next";
import { siteConfig } from "@/config/site";

export const metadata = siteConfig;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable}`}>
        <main>{children}</main>
      </body>
    </html>
  );
}
