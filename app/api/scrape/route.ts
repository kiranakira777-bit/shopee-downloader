import { NextRequest, NextResponse } from "next/server";
import { parseShopeeUrl } from "@/lib/parser";

export const runtime = "nodejs";
export const maxDuration = 30;

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

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json",
      "Accept-Language": "id-ID,id;q=0.9",
      Referer: `https://shopee.co.id/product/${shopId}/${itemId}`,
      Origin: "https://shopee.co.id",
      "X-Api-Source": "pc",
      "X-Shopee-Language": "id",
    };

    if (cookie && typeof cookie === "string" && cookie.trim()) {
      headers["Cookie"] = cookie.trim();
    }

    const res = await fetch(
      `https://shopee.co.id/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
      { headers, cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Shopee error: ${res.status}` }, { status: 502 });
    }

    const json = await res.json();

    if (json.error && json.error !== 0) {
      if (json.is_login) {
        return NextResponse.json({
          success: false,
          error: "Shopee membutuhkan cookie login. Masukkan cookie browser Shopee kamu di kolom Cookie.",
          needCookie: true,
        }, { status: 401 });
      }
      return NextResponse.json({ success: false, error: json.error_msg || "Shopee API error" }, { status: 502 });
    }

    const data = json.data;
    if (!data) {
      return NextResponse.json({ success: false, error: "Data produk tidak ditemukan." }, { status: 404 });
    }

    const images = (data.images || [])
      .filter(Boolean)
      .map((h: string) => h.startsWith("http") ? h : `https://down-id.img.susercontent.com/file/${h}`);

    if (images.length === 0) {
      return NextResponse.json({ success: false, error: "Tidak ada gambar ditemukan." }, { status: 404 });
    }

    const formatPrice = (p: number) =>
      new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p / 100000);

    const price = data.price
      ? formatPrice(data.price)
      : data.price_min
      ? `${formatPrice(data.price_min)} - ${formatPrice(data.price_max || data.price_min)}`
      : "Harga tidak tersedia";

    return NextResponse.json({
      success: true,
      title: data.name || "Produk Shopee",
      price,
      images,
      rating: data.item_rating?.rating_star,
      sold: data.historical_sold,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
