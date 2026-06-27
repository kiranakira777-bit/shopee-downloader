export interface ShopeeProductIds {
  shopId: string;
  itemId: string;
}

/**
 * Parses a Shopee product URL and extracts shopId and itemId.
 *
 * Supported formats:
 * 1. https://shopee.co.id/product/15443373/28229444664
 * 2. https://shopee.co.id/nama-produk-i.15443373.28229444664
 * 3. https://shopee.co.id/product/15443373/28229444664?...
 */
export function parseShopeeUrl(url: string): ShopeeProductIds | null {
  try {
    const parsed = new URL(url.trim());

    // Must be a Shopee domain
    const validDomains = [
      "shopee.co.id",
      "shopee.com",
      "shopee.sg",
      "shopee.ph",
      "shopee.my",
      "shopee.th",
      "shopee.vn",
      "shopee.tw",
      "shopee.com.br",
      "shopee.com.mx",
      "shopee.cl",
      "shopee.com.co",
    ];

    const hostname = parsed.hostname.replace("www.", "");
    if (!validDomains.includes(hostname)) {
      return null;
    }

    const pathname = parsed.pathname;

    // Format 1: /product/{shopId}/{itemId}
    const productPathMatch = pathname.match(/\/product\/(\d+)\/(\d+)/);
    if (productPathMatch) {
      return {
        shopId: productPathMatch[1],
        itemId: productPathMatch[2],
      };
    }

    // Format 2: /nama-produk-i.{shopId}.{itemId}
    // The slug ends with -i.{shopId}.{itemId} or just i.{shopId}.{itemId}
    const slugMatch = pathname.match(/[.-]i\.(\d+)\.(\d+)(?:\/)?$/);
    if (slugMatch) {
      return {
        shopId: slugMatch[1],
        itemId: slugMatch[2],
      };
    }

    // Format 3: query params (some redirect URLs)
    const shopId = parsed.searchParams.get("shopid");
    const itemId = parsed.searchParams.get("itemid");
    if (shopId && itemId) {
      return { shopId, itemId };
    }

    return null;
  } catch {
    return null;
  }
}

export function isValidShopeeUrl(url: string): boolean {
  return parseShopeeUrl(url) !== null;
}

export function formatPrice(price: number, currency = "IDR"): string {
  if (!price || isNaN(price)) return "Harga tidak tersedia";

  const actualPrice = price / 100000; // Shopee stores price * 100000

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(actualPrice);
}

export function buildImageUrl(imageHash: string, size = "_tn"): string {
  // Shopee CDN URL patterns
  // Full size: https://cf.shopee.co.id/file/{hash}
  // Thumbnail: https://cf.shopee.co.id/file/{hash}_tn
  if (!imageHash) return "";

  // If already a full URL, return as-is
  if (imageHash.startsWith("http")) return imageHash;

  return `https://down-id.img.susercontent.com/file/${imageHash}`;
}

export function buildFullImageUrl(imageHash: string): string {
  return buildImageUrl(imageHash, "");
}
