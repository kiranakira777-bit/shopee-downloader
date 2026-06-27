import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shopee Product Image Downloader",
  description:
    "Download semua foto produk Shopee dengan mudah — satu per satu atau sekaligus dalam file ZIP.",
  keywords: ["shopee", "download gambar", "foto produk", "shopee downloader"],
  openGraph: {
    title: "Shopee Product Image Downloader",
    description: "Download semua foto produk Shopee dengan mudah.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
