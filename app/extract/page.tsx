"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ProductGallery from "@/components/ProductGallery";
import { LoadingSpinner } from "@/components/Loading";

interface ProductData {
  title: string;
  price: string;
  images: string[];
}

function ExtractContent() {
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = searchParams.get("data");
      if (!data) {
        setError("Tidak ada data. Gunakan bookmarklet dari halaman Shopee.");
        return;
      }
      const parsed = JSON.parse(decodeURIComponent(data));
      if (!parsed.images?.length) {
        setError("Tidak ada gambar ditemukan dalam data.");
        return;
      }
      setProduct(parsed);
    } catch {
      setError("Data tidak valid.");
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <a href="/" className="text-orange-400 hover:underline text-sm">← Kembali ke beranda</a>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <a href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Kembali</a>
          <span className="text-xs text-zinc-600">Data dari Shopee via Bookmarklet</span>
        </div>
        <ProductGallery product={product} />
      </div>
    </div>
  );
}

export default function ExtractPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ExtractContent />
    </Suspense>
  );
}
