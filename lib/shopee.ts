import { buildFullImageUrl, formatPrice } from "./parser";

export interface ShopeeProduct {
  title: string;
  price: string;
  priceMin: string;
  priceMax: string;
  images: string[];
  shopId: string;
  itemId: string;
  description?: string;
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
    description?: string;
    item_rating?: {
      rating_star?: number;
    };
    historical_sold?: number;
  };
  error?: number;
  error_msg?: string;
}

const SHOPEE_API_BASE = "https://shopee.co.id/api/v4";

function getRequestHeaders(shopId: string, itemId: string) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    Referer: `https://shopee.co.id/product/${shopId}/${itemId}`,
    Origin: "https://shopee.co.id",
    "X-Requested-With": "XMLHttpRequest",
    "X-Api-Source": "pc",
    "X-Shopee-Language": "id",
    "X-Csrftoken": "placeholder",
    "cache-control": "no-cache",
    pragma: "no-cache",
    "sec-ch-ua": '"Chromium";v="125", "Not.A/Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
  };
}

const API_ENDPOINTS = [
  (shopId: string, itemId: string) =>
    `${SHOPEE_API_BASE}/item/get?itemid=${itemId}&shopid=${shopId}`,
  (shopId: string, itemId: string) =>
    `https://shopee.co.id/api/v2/item/get?itemid=${itemId}&shopid=${shopId}`,
];

export async function fetchShopeeProduct(
  shopId: string,
  itemId: string
): Promise<ShopeeProduct> {
  let lastError: Error = new Error("Gagal mengambil data produk.");

  for (const endpointFn of API_ENDPOINTS) {
    const url = endpointFn(shopId, itemId);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        headers: getRequestHeaders(shopId, itemId),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeout);

      if (response.status === 403) {
        lastError = new Error(
          "Shopee memblokir permintaan. Coba deploy ke Vercel atau tunggu beberapa menit."
        );
        continue;
      }

      if (response.status === 404) {
        throw new Error("Produk tidak ditemukan atau sudah dihapus.");
      }

      if (!response.ok) {
        lastError = new Error(`Server Shopee error: ${response.status}`);
        continue;
      }

      const json: ShopeeApiResponse = await response.json();

      if (json.error && json.error !== 0) {
        if (json.error === 4) {
          throw new Error("Produk tidak ditemukan atau sudah tidak tersedia.");
        }
        lastError = new Error(json.error_msg || `Shopee API error: ${json.error}`);
        continue;
      }

      const data = json.data;
      if (!data) {
        lastError = new Error("Data produk kosong. Coba link produk lain.");
        continue;
      }

      const rawImages = data.images || [];
      const images = rawImages
        .filter(Boolean)
        .map((hash: string) => buildFullImageUrl(hash));

      if (images.length === 0) {
        throw new Error("Tidak ada gambar ditemukan untuk produk ini.");
      }

      const currency = "IDR";
      const price = data.price
        ? formatPrice(data.price, currency)
        : data.price_min
        ? `${formatPrice(data.price_min, currency)} - ${formatPrice(
            data.price_max || data.price_min,
            currency
          )}`
        : "Harga tidak tersedia";

      return {
        title: data.name || "Produk Shopee",
        price,
        priceMin: data.price_min ? formatPrice(data.price_min, currency) : "",
        priceMax: data.price_max ? formatPrice(data.price_max, currency) : "",
        images,
        shopId,
        itemId,
        description: data.description,
        rating: data.item_rating?.rating_star,
        sold: data.historical_sold,
      };
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          lastError = new Error("Timeout: Shopee tidak merespons.");
          continue;
        }
        if (
          error.message.includes("tidak ditemukan") ||
          error.message.includes("dihapus") ||
          error.message.includes("tidak tersedia") ||
          error.message.includes("gambar")
        ) {
          throw error;
        }
        lastError = error;
      }
    }
  }

  throw lastError;
}