import { NextRequest, NextResponse } from "next/server";
import { parseShopeeUrl } from "@/lib/parser";

export const runtime = "nodejs";
export const maxDuration = 30;

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(p / 100000);
}

function buildImageUrl(hash: string): string {
  if (hash.startsWith("http")) return hash;
  return `https://down-id.img.susercontent.com/file/${hash}`;
}

async function tryShopeePublicApi(shopId: string, itemId: string) {
  try {
    const res = await fetch(
      `https://shopee.co.id/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
      {
        headers: {
          "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
          Accept: "application/json",
          "Accept-Language": "id",
          Referer: "https://shopee.co.id/",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.data || json.error) return null;
    const images = (json.data.images || []).filter(Boolean).map((h: string) => buildImageUrl(h));
    if (!images.length) return null;
    const price = json.data.price ? formatPrice(json.data.price)
      : json.data.price_min ? `${formatPrice(json.data.price_min)} - ${formatPrice(json.data.price_max || json.data.price_min)}`
      : "Harga tidak tersedia";
    return { title: json.data.name || "Produk Shopee", price, images, rating: json.data.item_rating?.rating_star, sold: json.data.historical_sold };
  } catch { return null; }
}

async function scrapeProductImages(shopId: string, itemId: string, originalUrl: string) {
  try {
    const urls = [originalUrl, `https://shopee.co.id/product/${shopId}/${itemId}`];
    for (const pageUrl of urls) {
      const res = await fetch(pageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          Accept: "text/html",
          "Accept-Language": "id-ID",
        },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const html = await res.text();
      const images: string[] = [];
      const seen = new Set<string>();
      for (const m of html.matchAll(/https:\/\/[^"'\s]+susercontent\.com\/file\/[^"'\s?]+/g)) {
        const imgUrl = m[0].split("?")[0];
        if (!seen.has(imgUrl)) { seen.add(imgUrl); images.push(imgUrl); }
      }
      for (const m of html.matchAll(/https:\/\/cf\.shopee\.co\.id\/file\/[a-zA-Z0-9_-]+/g)) {
        if (!seen.has(m[0])) { seen.add(m[0]); images.push(m[0]); }
      }
      if (images.length > 0) {
        const titleM = html.match(/<title>([^<]+)<\/title>/);
        const title = titleM ? titleM[1].replace(" | Shopee Indonesia", "").trim() : "Produk Shopee";
        return { title, price: "Lihat di Shopee", images };
      }
    }
    return null;
  } catch { return null; }
}

async function scrapeMetaTags(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const images: string[] = [];
    for (const m of html.matchAll(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/g)) {
      if (m[1] && !images.includes(m[1])) images.push(m[1]);
    }
    const titleM = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/);
    return images.length ? { title: titleM?.[1] || "", images } : null;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, cookie } = body;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "URL tidak boleh kosong." }, { status: 400 });
    }
    const trimmedUrl = url.trim();
    const ids = parseShopeeUrl(trimmedUrl);
    if (!ids) {
      return NextResponse.json({ success: false, error: "URL Shopee tidak valid." }, { status: 400 });
    }
    const { shopId, itemId } = ids;

    if (cookie?.trim()) {
      try {
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
              Cookie: cookie.trim(),
            },
            cache: "no-store",
          }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data && (!json.error || json.error === 0)) {
            const images = (json.data.images || []).filter(Boolean).map((h: string) => buildImageUrl(h));
            if (images.length > 0) {
              const price = json.data.price ? formatPrice(json.data.price)
                : json.data.price_min ? `${formatPrice(json.data.price_min)} - ${formatPrice(json.data.price_max || json.data.price_min)}`
                : "Harga tidak tersedia";
              return NextResponse.json({ success: true, title: json.data.name || "Produk Shopee", price, images, rating: json.data.item_rating?.rating_star, sold: json.data.historical_sold });
            }
          }
        }
      } catch { /* fall through */ }
    }

    const [r1, r2, r3] = await Promise.allSettled([
      tryShopeePublicApi(shopId, itemId),
      scrapeProductImages(shopId, itemId, trimmedUrl),
      scrapeMetaTags(trimmedUrl),
    ]);

    for (const r of [r1, r2, r3]) {
      if (r.status === "fulfilled" && r.value?.images?.length) {
        const v = r.value;
        return NextResponse.json({ success: true, title: v.title, price: ("price" in v ? v.price : "Lihat di Shopee"), images: v.images });
      }
    }

    return NextResponse.json({
      success: false,
      error: "Shopee memblokir akses. Coba masukkan Cookie Shopee kamu di kolom opsional lalu coba lagi.",
      needCookie: true,
    }, { status: 503 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
