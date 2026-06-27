import { NextRequest, NextResponse } from "next/server";
import { parseShopeeUrl } from "@/lib/parser";

export const runtime = "nodejs";
export const maxDuration = 30;

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p / 100000);
}

function buildImageUrl(h: string): string {
  if (h.startsWith("http")) return h;
  return `https://down-id.img.susercontent.com/file/${h}`;
}

async function resolveShortUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    return res.url;
  } catch { return url; }
}

async function fetchWithCookie(shopId: string, itemId: string, cookie: string) {
  const res = await fetch(
    `https://shopee.co.id/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "id-ID,id;q=0.9",
        Referer: `https://shopee.co.id/product/${shopId}/${itemId}`,
        Origin: "https://shopee.co.id",
        "X-Api-Source": "pc",
        "X-Shopee-Language": "id",
        Cookie: cookie,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.data || (json.error && json.error !== 0)) return null;
  const images = (json.data.images || []).filter(Boolean).map((h: string) => buildImageUrl(h));
  if (!images.length) return null;
  const price = json.data.price ? formatPrice(json.data.price)
    : json.data.price_min ? `${formatPrice(json.data.price_min)} - ${formatPrice(json.data.price_max || json.data.price_min)}`
    : "Harga tidak tersedia";
  return { title: json.data.name || "Produk Shopee", price, images, rating: json.data.item_rating?.rating_star, sold: json.data.historical_sold };
}

async function scrapeMetaTags(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", Accept: "text/html" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const images: string[] = [];
    for (const m of html.matchAll(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/g)) {
      if (m[1] && !images.includes(m[1])) images.push(m[1]);
    }
    for (const m of html.matchAll(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/g)) {
      if (m[1] && !images.includes(m[1])) images.push(m[1]);
    }
    const titleM = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/);
    return images.length ? { title: titleM?.[1]?.replace(" | Shopee Indonesia","").trim() || "Produk Shopee", images } : null;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { url, cookie } = body;

    if (!url?.trim()) return NextResponse.json({ success: false, error: "URL tidak boleh kosong." }, { status: 400 });

    url = url.trim();

    // Resolve short URLs (s.shopee.co.id)
    const ids = parseShopeeUrl(url);
    if (ids?.shopId === "short") {
      url = await resolveShortUrl(ids.itemId);
    }

    const finalIds = parseShopeeUrl(url);
    if (!finalIds || finalIds.shopId === "short") {
      return NextResponse.json({ success: false, error: "URL Shopee tidak valid atau link pendek tidak bisa di-resolve." }, { status: 400 });
    }

    const { shopId, itemId } = finalIds;

    // Try with cookie first
    if (cookie?.trim()) {
      try {
        const result = await fetchWithCookie(shopId, itemId, cookie.trim());
        if (result) return NextResponse.json({ success: true, ...result });
      } catch { /* fall through */ }
    }

    // Fallback: og:image meta tags
    const meta = await scrapeMetaTags(url);
    if (meta?.images?.length) {
      return NextResponse.json({ success: true, title: meta.title, price: "Lihat di Shopee", images: meta.images });
    }

    return NextResponse.json({
      success: false,
      error: "Hanya mendapat 1 foto (thumbnail). Untuk semua foto, masukkan Cookie Shopee kamu di kolom opsional.",
      needCookie: true,
    }, { status: 503 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
