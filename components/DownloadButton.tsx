"use client";

import { useState } from "react";
import { Download, Check, Loader2 } from "lucide-react";
import { downloadSingleImage } from "@/lib/downloader";

interface DownloadButtonProps {
  url: string;
  filename: string;
  className?: string;
  label?: string;
  variant?: "icon" | "full";
}

export default function DownloadButton({
  url,
  filename,
  className = "",
  label = "Download",
  variant = "icon",
}: DownloadButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  const handleDownload = async () => {
    if (state !== "idle") return;
    setState("loading");

    try {
      await downloadSingleImage(url, filename);
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      console.error("Download error:", err);
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  };

  if (variant === "full") {
    return (
      <button
        onClick={handleDownload}
        disabled={state !== "idle"}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          state === "done"
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : state === "error"
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-600"
        } ${className}`}
      >
        {state === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {state === "done" && <Check className="h-4 w-4" />}
        {state === "error" && <span className="text-xs">Gagal</span>}
        {state === "idle" && <Download className="h-4 w-4" />}
        <span>{state === "done" ? "Tersimpan!" : state === "error" ? "Coba lagi" : label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={state !== "idle"}
      title={label}
      className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
        state === "done"
          ? "bg-green-500/20 text-green-400"
          : state === "error"
          ? "bg-red-500/20 text-red-400"
          : "bg-black/60 text-white hover:bg-orange-500/80 backdrop-blur-sm"
      } ${className}`}
    >
      {state === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {state === "done" && <Check className="h-3.5 w-3.5" />}
      {(state === "idle" || state === "error") && (
        <Download className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
