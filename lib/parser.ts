export interface ShopeeProductIds {
  shopId: string;
  itemId: string;
}

export function parseShopeeUrl(url: string): ShopeeProductIds | null {
  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.replace("www.", "");

    // Short URL — will be resolved by API route
    if (hostname === "s.shopee.co.id" || hostname === "shope.ee") {
      return { shopId: "short", itemId: url.trim() };
    }

    const validDomains = ["shopee.co.id","shopee.com","shopee.sg","shopee.ph","shopee.my","shopee.th","shopee.vn","shopee.tw"];
    if (!validDomains.includes(hostname)) return null;

    const pathname = parsed.pathname;

    // Format: /product/{shopId}/{itemId}
    const productMatch = pathname.match(/\/product\/(\d+)\/(\d+)/);
    if (productMatch) return { shopId: productMatch[1], itemId: productMatch[2] };

    // Format: /nama-produk-i.{shopId}.{itemId}
    const slugMatch = pathname.match(/[.-]i\.(\d+)\.(\d+)(?:\/)?$/);
    if (slugMatch) return { shopId: slugMatch[1], itemId: slugMatch[2] };

    // Query params
    const shopId = parsed.searchParams.get("shopid");
    const itemId = parsed.searchParams.get("itemid");
    if (shopId && itemId) return { shopId, itemId };

    return null;
  } catch { return null; }
}

export function isValidShopeeUrl(url: string): boolean {
  if (url.includes("s.shopee.co.id") || url.includes("shope.ee")) return true;
  return parseShopeeUrl(url) !== null;
}

export function formatPrice(price: number, currency = "IDR"): string {
  if (!price || isNaN(price)) return "Harga tidak tersedia";
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price / 100000);
}

export function buildFullImageUrl(imageHash: string): string {
  if (!imageHash) return "";
  if (imageHash.startsWith("http")) return imageHash;
  return `https://down-id.img.susercontent.com/file/${imageHash}`;
}
