"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Link2, X, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "./Loading";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export default function UrlInput({ onSubmit, isLoading, error }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSubmit(url.trim());
    }
  };

  const handleClear = () => {
    setUrl("");
    inputRef.current?.focus();
  };

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text?.includes("shopee")) {
        setUrl(text.trim());
      }
    } catch {
      // Clipboard access denied, ignore
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const text = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text/uri-list");
    if (text?.trim()) {
      setUrl(text.trim());
    }
  }, []);

  const exampleUrls = [
    "https://shopee.co.id/produk-i.15443373.28229444664",
    "https://shopee.co.id/product/15443373/28229444664",
  ];

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="w-full">
        <div
          className={`relative rounded-2xl transition-all duration-200 ${
            isDragging
              ? "ring-2 ring-orange-500 bg-orange-500/5"
              : "ring-1 ring-zinc-700/80"
          } bg-zinc-900`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-center gap-3 p-2 pl-4">
            <Link2
              className={`shrink-0 h-5 w-5 transition-colors ${
                url ? "text-orange-400" : "text-zinc-500"
              }`}
            />
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Tempel link produk Shopee di sini..."
              className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 text-sm outline-none py-3 min-w-0"
              disabled={isLoading}
              aria-label="URL Produk Shopee"
            />
            {url && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="shrink-0 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                aria-label="Hapus URL"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              className="shrink-0 flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white disabled:cursor-not-allowed px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 active:scale-95"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="hidden sm:inline">Mengambil...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Ambil Foto</span>
                </>
              )}
            </button>
          </div>

          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-orange-500/10 border-2 border-dashed border-orange-500/50 pointer-events-none">
              <p className="text-orange-400 font-medium text-sm">
                Lepas link di sini
              </p>
            </div>
          )}
        </div>
      </form>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-600">
        <span className="text-zinc-500">Contoh:</span>
        {exampleUrls.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setUrl(ex)}
            className="font-mono text-zinc-500 hover:text-orange-400 transition-colors truncate max-w-xs"
          >
            {ex.replace("https://shopee.co.id/", "shopee.co.id/")}
          </button>
        ))}
        <button
          type="button"
          onClick={handlePaste}
          className="flex items-center gap-1 text-zinc-500 hover:text-orange-400 transition-colors ml-auto"
        >
          <Link2 className="h-3 w-3" />
          Tempel dari clipboard
        </button>
      </div>
    </div>
  );
}
