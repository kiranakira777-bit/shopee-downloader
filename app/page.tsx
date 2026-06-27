"use client";

import { useState } from "react";
import { ShoppingBag, Github, Zap } from "lucide-react";
import UrlInput from "@/components/UrlInput";
import ProductGallery from "@/components/ProductGallery";
import { SkeletonGallery } from "@/components/Loading";

interface ProductData {
  title: string;
  price: string;
  images: string[];
  rating?: number;
  sold?: number;
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);

  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setProduct(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || `Error ${response.status}: ${response.statusText}`
        );
      }

      setProduct({
        title: data.title,
        price: data.price,
        images: data.images,
        rating: data.rating,
        sold: data.sold,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <ShoppingBag className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100 leading-none">
                Shopee Downloader
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">Image Extractor</p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Source code"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Hero */}
        {!product && !isLoading && (
          <div className="text-center space-y-3 pt-4">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium px-3 py-1.5 rounded-full">
              <Zap className="h-3 w-3" />
              Gratis & tanpa login
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
              Download Foto Produk{" "}
              <span className="text-orange-400">Shopee</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
              Tempel link produk Shopee, ambil semua foto produk, dan unduh
              sekaligus dalam satu file ZIP — atau satu per satu.
            </p>
          </div>
        )}

        {/* Input */}
        <div className={product || isLoading ? "" : "max-w-2xl mx-auto"}>
          <UrlInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Loading skeleton */}
        {isLoading && <SkeletonGallery />}

        {/* Product Gallery */}
        {product && !isLoading && <ProductGallery product={product} />}

        {/* Empty state / features */}
        {!product && !isLoading && !error && (
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {[
              {
                icon: "📦",
                title: "Semua format URL",
                desc: "Mendukung link pendek maupun link lengkap Shopee.",
              },
              {
                icon: "⚡",
                title: "Download cepat",
                desc: "Ambil semua foto sekaligus dalam file ZIP yang siap diunduh.",
              },
              {
                icon: "🔒",
                title: "Privasi terjaga",
                desc: "Tidak ada data yang disimpan. Semua proses terjadi langsung.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="font-semibold text-zinc-200 text-sm">{f.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800/60 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-zinc-600">
          Dibuat untuk mempermudah download foto produk Shopee. Bukan afiliasi
          resmi Shopee.
        </div>
      </footer>
    </div>
  );
}
