"use client";

import { useState } from "react";
import { ShoppingBag, Github, Zap, BookMarked, Copy, Check, ChevronDown, ChevronUp, Key } from "lucide-react";
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

// Bookmarklet code — runs on Shopee page, extracts image data
const BOOKMARKLET_CODE = `javascript:(function(){
  var d=window.__INITIAL_STATE__;
  var item=null;
  try{item=d.pdpReducer.product||d.itemDetail.item||null;}catch(e){}
  if(!item){
    var scripts=document.querySelectorAll('script');
    for(var i=0;i<scripts.length;i++){
      var t=scripts[i].textContent;
      if(t&&t.includes('"images"')&&t.includes('"name"')){
        var m=t.match(/"name":"([^"]{5,}?)","description"/);
        var imgs=[];
        var re=/["']([a-f0-9]{32})["']/g,match;
        while((match=re.exec(t))!==null)imgs.push(match[1]);
        if(imgs.length>0){item={name:m?m[1]:"Produk Shopee",images:imgs,price:0};}
        break;
      }
    }
  }
  if(!item||!item.images||!item.images.length){
    alert("Tidak bisa ekstrak data. Coba refresh halaman Shopee dulu.");
    return;
  }
  var base="https://down-id.img.susercontent.com/file/";
  var imgs=item.images.map(function(h){return h.startsWith("http")?h:base+h;});
  var price=item.price?new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0}).format(item.price/100000):"Lihat di Shopee";
  var data={title:item.name||"Produk Shopee",price:price,images:imgs};
  var url="https://shopee-downloader-six.vercel.app/extract?data="+encodeURIComponent(JSON.stringify(data));
  window.open(url,"_blank");
})();`;

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [cookie, setCookie] = useState("");
  const [showCookie, setShowCookie] = useState(false);
  const [needCookie, setNeedCookie] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBookmarklet, setShowBookmarklet] = useState(false);

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
        if (data.needCookie) { setNeedCookie(true); setShowBookmarklet(true); }
        throw new Error(data.error || "Terjadi kesalahan.");
      }
      setProduct({ title: data.title, price: data.price, images: data.images, rating: data.rating, sold: data.sold });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBookmarklet = async () => {
    await navigator.clipboard.writeText(BOOKMARKLET_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              Gunakan bookmarklet untuk mengambil semua foto produk langsung dari halaman Shopee.
            </p>
          </div>
        )}

        {/* Bookmarklet — cara utama */}
        {!product && !isLoading && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl bg-zinc-900 border border-orange-500/20 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-orange-500/10 shrink-0">
                  <BookMarked className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">Cara Terbaik: Bookmarklet</h3>
                  <p className="text-zinc-500 text-xs">Klik sekali di halaman Shopee → semua foto langsung muncul</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">1</span>
                  <span>Klik tombol <strong className="text-zinc-300">Salin Kode Bookmarklet</strong> di bawah</span>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">2</span>
                  <span>Buka <strong className="text-zinc-300">Bookmark Manager</strong> browser kamu (Ctrl+Shift+O)</span>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">3</span>
                  <span>Buat bookmark baru → nama: <strong className="text-zinc-300">Shopee DL</strong> → paste kode di kolom URL</span>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">4</span>
                  <span>Buka halaman produk Shopee → klik bookmark <strong className="text-zinc-300">Shopee DL</strong></span>
                </div>
              </div>

              <button
                onClick={handleCopyBookmarklet}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  copied
                    ? "bg-green-500/20 border border-green-500/30 text-green-400"
                    : "bg-orange-500 hover:bg-orange-400 text-white"
                }`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Kode berhasil disalin!" : "Salin Kode Bookmarklet"}
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        {!product && !isLoading && (
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs">atau coba dengan URL langsung</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
        )}

        <div className={product || isLoading ? "" : "max-w-2xl mx-auto space-y-3"}>
          <UrlInput onSubmit={handleSubmit} isLoading={isLoading} error={error} />

          {/* Cookie input */}
          <div>
            <button
              onClick={() => setShowCookie(!showCookie)}
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors ${
                needCookie
                  ? "text-orange-400 bg-orange-500/10 border border-orange-500/30 w-full justify-center"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <Key className="h-3 w-3" />
              {needCookie ? "⚠️ Cookie diperlukan untuk semua foto" : "Input Cookie (opsional)"}
              {showCookie ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showCookie && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="Paste cookie dari browser Shopee kamu..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-orange-500/50 font-mono resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bookmarklet toggle when needed */}
        {(needCookie || showBookmarklet) && !product && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowBookmarklet(!showBookmarklet)}
              className="flex items-center gap-2 text-orange-400 text-sm hover:text-orange-300 transition-colors"
            >
              <BookMarked className="h-4 w-4" />
              Lebih mudah: gunakan Bookmarklet
              {showBookmarklet ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        )}

        {isLoading && <SkeletonGallery />}
        {product && !isLoading && <ProductGallery product={product} />}
      </main>

      <footer className="border-t border-zinc-800/60 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-zinc-600">
          Dibuat untuk mempermudah download foto produk Shopee. Bukan afiliasi resmi Shopee.
        </div>
      </footer>
    </div>
  );
}
