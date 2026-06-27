"use client";

import { useState } from "react";
import { ShoppingBag, Github, Zap, ChevronDown, ChevronUp, Key } from "lucide-react";
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
  const [cookie, setCookie] = useState("");
  const [showCookie, setShowCookie] = useState(false);
  const [needCookie, setNeedCookie] = useState(false);

  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setProduct(null);
    setNeedCookie(false);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, cookie: cookie || undefined }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.needCookie) {
          setNeedCookie(true);
          setShowCookie(true);
        }
        throw new Error(data.error || "Terjadi kesalahan.");
      }

      setProduct({ title: data.title, price: data.price, images: data.images, rating: data.rating, sold: data.sold });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <ShoppingBag className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100 leading-none">Shopee Downloader</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Image Extractor</p>
            </div>
          </div>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Github className="h-4 w-4" />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {!product && !isLoading && (
          <div className="text-center space-y-3 pt-4">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium px-3 py-1.5 rounded-full">
              <Zap className="h-3 w-3" />
              Gratis & tanpa login
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
              Download Foto Produk <span className="text-orange-400">Shopee</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
              Tempel link produk Shopee, ambil semua foto produk, dan unduh sekaligus dalam satu file ZIP.
            </p>
          </div>
        )}

        <div className={product || isLoading ? "" : "max-w-2xl mx-auto space-y-3"}>
          <UrlInput onSubmit={handleSubmit} isLoading={isLoading} error={error} />

          {/* Cookie input */}
          <div className={`max-w-2xl ${product || isLoading ? "mx-0" : "mx-auto"}`}>
            <button
              onClick={() => setShowCookie(!showCookie)}
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors ${
                needCookie
                  ? "text-orange-400 bg-orange-500/10 border border-orange-500/30 w-full justify-center"
                  : "text-zinc-500 hover:text-zinc-400"
              }`}
            >
              <Key className="h-3 w-3" />
              {needCookie ? "⚠️ Cookie Shopee diperlukan — klik untuk input" : "Input Cookie Shopee (opsional)"}
              {showCookie ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showCookie && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="Paste cookie dari browser Shopee kamu di sini..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-orange-500/50 font-mono resize-none"
                />
                <div className="text-xs text-zinc-600 space-y-1">
                  <p className="text-zinc-500 font-medium">Cara ambil cookie:</p>
                  <p>1. Buka shopee.co.id → Login → tekan F12</p>
                  <p>2. Tab Network → refresh halaman → klik request shopee.co.id</p>
                  <p>3. Headers → Request Headers → copy nilai <code className="text-orange-400">Cookie:</code></p>
                  <p>4. Paste di kolom di atas</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading && <SkeletonGallery />}
        {product && !isLoading && <ProductGallery product={product} />}

        {!product && !isLoading && !error && (
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {[
              { icon: "📦", title: "Semua format URL", desc: "Mendukung link pendek maupun link lengkap Shopee." },
              { icon: "⚡", title: "Download cepat", desc: "Ambil semua foto sekaligus dalam file ZIP." },
              { icon: "🔒", title: "Privasi terjaga", desc: "Cookie hanya dipakai untuk fetch data, tidak disimpan." },
            ].map((f) => (
              <div key={f.title} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
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
          Dibuat untuk mempermudah download foto produk Shopee. Bukan afiliasi resmi Shopee.
        </div>
      </footer>
    </div>
  );
}
