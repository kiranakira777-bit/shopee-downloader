"use client";

import { useState, useCallback } from "react";
import {
  Download,
  Images,
  Star,
  ShoppingBag,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Archive,
  Loader2,
} from "lucide-react";
import DownloadButton from "./DownloadButton";
import { downloadAllAsZip, DownloadProgress } from "@/lib/downloader";

interface ProductData {
  title: string;
  price: string;
  images: string[];
  rating?: number;
  sold?: number;
}

interface ProductGalleryProps {
  product: ProductData;
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

export default function ProductGallery({ product }: ProductGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [zipProgress, setZipProgress] = useState<DownloadProgress | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const showToast = useCallback((message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCopyLink = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      showToast("Link gambar berhasil disalin!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      showToast("Gagal menyalin link", "error");
    }
  };

  const handleDownloadAll = async () => {
    if (isZipping) return;
    setIsZipping(true);
    setZipProgress({ current: 0, total: product.images.length, percentage: 0, currentFile: "" });

    try {
      await downloadAllAsZip(product.images, product.title, (progress) => {
        setZipProgress(progress);
      });
      showToast(`${product.images.length} foto berhasil diunduh sebagai ZIP!`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal membuat ZIP",
        "error"
      );
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === 0 ? product.images.length - 1 : lightboxIndex - 1
    );
  };

  const nextImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === product.images.length - 1 ? 0 : lightboxIndex + 1
    );
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") closeLightbox();
    },
    [lightboxIndex]
  );

  const safeFilename = (title: string) =>
    title.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim().substring(0, 40) || "shopee";

  return (
    <div className="space-y-6">
      {/* Product Info Card */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h2 className="text-lg font-semibold text-zinc-100 leading-tight line-clamp-2">
              {product.title}
            </h2>
            <p className="text-2xl font-bold text-orange-400">{product.price}</p>
          </div>
          <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <Images className="h-4 w-4 text-orange-400" />
            <span className="text-orange-400 font-semibold text-sm">
              {product.images.length} foto
            </span>
          </div>
        </div>

        {(product.rating || product.sold) && (
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            {product.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                {product.rating.toFixed(1)}
              </span>
            )}
            {product.sold && (
              <span className="flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5" />
                {product.sold.toLocaleString("id-ID")} terjual
              </span>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-zinc-800">
          <button
            onClick={handleDownloadAll}
            disabled={isZipping}
            className="w-full flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-xl transition-all duration-150 active:scale-[0.98]"
          >
            {isZipping ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>
                  {zipProgress
                    ? `Mengunduh ${zipProgress.current}/${zipProgress.total} (${zipProgress.percentage}%)`
                    : "Mempersiapkan..."}
                </span>
              </>
            ) : (
              <>
                <Archive className="h-5 w-5" />
                <span>Download Semua ({product.images.length} foto)</span>
              </>
            )}
          </button>

          {/* Progress bar */}
          {isZipping && zipProgress && (
            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${zipProgress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 text-center">
                {zipProgress.currentFile}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {product.images.map((url, index) => (
          <div
            key={index}
            className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/proxy-image?url=${encodeURIComponent(url)}`}
              alt={`${product.title} - foto ${index + 1}`}
              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%2327272a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2371717a' font-size='12'%3EGagal memuat%3C/text%3E%3C/svg%3E";
              }}
            />

            {/* Image number badge */}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-mono px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              {index + 1}
            </div>

            {/* Action buttons overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Preview fullscreen */}
              <button
                onClick={() => openLightbox(index)}
                title="Lihat fullscreen"
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-black/60 text-white hover:bg-zinc-700/80 backdrop-blur-sm transition-colors"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              {/* Copy link */}
              <button
                onClick={() => handleCopyLink(url, index)}
                title="Salin link gambar"
                className={`flex items-center justify-center h-8 w-8 rounded-lg backdrop-blur-sm transition-colors ${
                  copiedIndex === index
                    ? "bg-green-500/80 text-white"
                    : "bg-black/60 text-white hover:bg-zinc-700/80"
                }`}
              >
                {copiedIndex === index ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Download single */}
              <DownloadButton
                url={url}
                filename={`${safeFilename(product.title)}_${String(index + 1).padStart(2, "0")}.jpg`}
                label="Unduh foto ini"
              />
            </div>

            {/* Bottom caption */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
              <p className="text-white text-xs font-mono">
                image_{String(index + 1).padStart(2, "0")}.jpg
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau gambar"
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/80 rounded-xl transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-800/80 text-zinc-300 text-sm px-4 py-2 rounded-full font-mono z-10">
            {lightboxIndex + 1} / {product.images.length}
          </div>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 p-3 text-zinc-400 hover:text-white bg-zinc-800/80 rounded-xl transition-colors z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Image */}
          <div
            className="max-w-4xl max-h-[85vh] mx-16 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/proxy-image?url=${encodeURIComponent(product.images[lightboxIndex])}`}
              alt={`${product.title} - foto ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 p-3 text-zinc-400 hover:text-white bg-zinc-800/80 rounded-xl transition-colors z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Download in lightbox */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <DownloadButton
              url={product.images[lightboxIndex]}
              filename={`${safeFilename(product.title)}_${String(lightboxIndex + 1).padStart(2, "0")}.jpg`}
              label={`Unduh foto ${lightboxIndex + 1}`}
              variant="full"
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl font-medium text-sm transition-all backdrop-blur-sm ${
            toast.type === "success"
              ? "bg-green-500/20 border border-green-500/30 text-green-400"
              : toast.type === "error"
              ? "bg-red-500/20 border border-red-500/30 text-red-400"
              : "bg-zinc-800 border border-zinc-700 text-zinc-300"
          }`}
        >
          {toast.type === "success" && <Check className="h-4 w-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
