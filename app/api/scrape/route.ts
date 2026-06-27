import { NextRequest, NextResponse } from "next/server";
import { parseShopeeUrl } from "@/lib/parser";
import { fetchShopeeProduct } from "@/lib/shopee";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "URL tidak boleh kosong." }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    if (!trimmedUrl.startsWith("http")) {
      return NextResponse.json({ success: false, error: "URL harus diawali dengan https://" }, { status: 400 });
    }

    const ids = parseShopeeUrl(trimmedUrl);
    if (!ids) {
      return NextResponse.json({
        success: false,
        error: "URL Shopee tidak valid. Contoh: https://shopee.co.id/produk-i.123.456",
      }, { status: 400 });
    }

    const product = await fetchShopeeProduct(ids.shopId, ids.itemId, trimmedUrl);

    return NextResponse.json({
      success: true,
      title: product.title,
      price: product.price,
      images: product.images,
      rating: product.rating,
      sold: product.sold,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    const status = message.includes("tidak ditemukan") ? 404
      : message.includes("Timeout") ? 504
      : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
