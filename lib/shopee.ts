import { buildFullImageUrl, formatPrice } from "./parser";

export interface ShopeeProduct {
  title: string;
  price: string;
  priceMin: string;
  priceMax: string;
  images: string[];
  shopId: string;
  itemId: string;
  rating?: number;
  sold?: number;
}

interface ShopeeApiResponse {
  data?: {
    name?: string;
    price?: number;
    price_min?: number;
    price_max?: number;
    images?: string[];
    item_rating?: { rating_star?: number };
    historical_sold?: number;
  };
  error?: number;
  error_msg?: string;
}

function randomUserAgent(): string {
  const agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

function buildHeaders(shopId: string, itemId: string) {
  return {
    "User-Agent": randomUserAgent(),
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    Referer: `https://shopee.co.id/product/${shopId}/${itemId}`,
    Origin: "https://shopee.co.id",
    "X-Api-Source": "pc",
    "X-Shopee-Language": "id",
    "X-Requested-With": "XMLHttpRequest",
    "Cache-Control": "no-cache",
  };
}

function parseApiResponse(json: ShopeeApiResponse, shopId: string, itemId: string): ShopeeProduct | null {
  const data = json.data;
  if (!data) return null;
  const images = (data.images || []).filter(Boolean).map((h: string) => {
  if (h.startsWith("http")) return h;
  return `https://down-id.img.susercontent.com/file/${h}`;
});
  if (images.length === 0) return null;
  const currency = "IDR";
  const price = data.price
    ? formatPrice(data.price, currency)
    : data.price_min
    ? `${formatPrice(data.price_min, currency)} - ${formatPrice(data.price_max || data.price_min, currency)}`
    : "Harga tidak tersedia";
  return {
    title: data.name || "Produk Shopee",
    price,
    priceMin: data.price_min ? formatPrice(data.price_min, currency) : "",
    priceMax: data.price_max ? formatPrice(data.price_max, currency) : "",
    images,
    shopId,
    itemId,
    rating: data.item_rating?.rating_star,
    sold: data.historical_sold,
  };
}

async function tryApiV4(shopId: string, itemId: string): Promise<ShopeeProduct | null> {
  try {
    const res = await fetch(
      `https://shopee.co.id/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
      { headers: buildHeaders(shopId, itemId), cache: "no-store" }
    );
    if (!res.ok) return null;
    const json: ShopeeApiResponse = await res.json();
    if (!json.data || (json.error && json.error !== 0)) return null;
    return parseApiResponse(json, shopId, itemId);
  } catch { return null; }
}

async function tryApiV2(shopId: string, itemId: string): Promise<ShopeeProduct | null> {
  try {
    const res = await fetch(
      `https://shopee.co.id/api/v2/item/get?itemid=${itemId}&shopid=${shopId}`,
      { headers: buildHeaders(shopId, itemId), cache: "no-store" }
    );
    if (!res.ok) return null;
    const json: ShopeeApiResponse = await res.json();
    if (!json.data || (json.error && json.error !== 0)) return null;
    return parseApiResponse(json, shopId, itemId);
  } catch { return null; }
}

async function tryHtmlScrape(shopId: string, itemId: string, originalUrl?: string): Promise<ShopeeProduct | null> {
  try {
    const pageUrl = originalUrl || `https://shopee.co.id/product/${shopId}/${itemId}`;
    const res = await fetch(pageUrl, {
      headers: {
        "User-Agent": randomUserAgent(),
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const itemData =
          nextData?.props?.pageProps?.initialData?.data?.productItem ||
          nextData?.props?.pageProps?.product;
        if (itemData?.images?.length) {
          return {
            title: itemData.name || "Produk Shopee",
            price: itemData.price ? formatPrice(itemData.price, "IDR") : "Harga tidak tersedia",
            priceMin: "",
            priceMax: "",
            images: itemData.images.filter(Boolean).map((h: string) => buildFullImageUrl(h)),
            shopId,
            itemId,
            rating: itemData.item_rating?.rating_star,
            sold: itemData.historical_sold,
          };
        }
      } catch { /* continue */ }
    }

    // Extract image hashes from "images":[...] in HTML — no /s flag needed
    const imgKey = '"images":["';
    const imgStart = html.indexOf(imgKey);
    if (imgStart !== -1) {
      const chunk = html.substring(imgStart, imgStart + 2000);
      const hashes: string[] = [];
      for (const m of chunk.matchAll(/["']([a-f0-9]{32})["']/g)) {
        hashes.push(buildFullImageUrl(m[1]));
      }
      if (hashes.length > 0) {
        const titleMatch = html.match(/"name":"([^"]{5,200})"/);
        const priceMatch = html.match(/"price":(\d+)/);
        return {
          title: titleMatch ? titleMatch[1] : "Produk Shopee",
          price: priceMatch ? formatPrice(parseInt(priceMatch[1]), "IDR") : "Harga tidak tersedia",
          priceMin: "",
          priceMax: "",
          images: hashes,
          shopId,
          itemId,
        };
      }
    }

    return null;
  } catch { return null; }
}

export async function fetchShopeeProduct(
  shopId: string,
  itemId: string,
  originalUrl?: string
): Promise<ShopeeProduct> {
  const results = await Promise.allSettled([
    tryApiV4(shopId, itemId),
    tryApiV2(shopId, itemId),
    tryHtmlScrape(shopId, itemId, originalUrl),
  ]);

  for (const result of results) {
    if (result.status === "fulfilled" && result.value && result.value.images.length > 0) {
      return result.value;
    }
  }

  throw new Error(
    "Tidak dapat mengambil data produk. Shopee membatasi akses saat ini — coba lagi dalam beberapa menit."
  );
}
