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
      return NextResponse.json(
        { success: false, error: "URL tidak boleh kosong." },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    if (!trimmedUrl.startsWith("http")) {
      return NextResponse.json(
        {
          success: false,
          error: "URL harus diawali dengan http:// atau https://",
        },
        { status: 400 }
      );
    }

    const ids = parseShopeeUrl(trimmedUrl);

    if (!ids) {
      return NextResponse.json(
        {
          success: false,
          error:
            "URL Shopee tidak valid. Pastikan format URL benar. Contoh: https://shopee.co.id/produk-i.123456.789012",
        },
        { status: 400 }
      );
    }

    const product = await fetchShopeeProduct(ids.shopId, ids.itemId);

    return NextResponse.json({
      success: true,
      title: product.title,
      price: product.price,
      images: product.images,
      shopId: ids.shopId,
      itemId: ids.itemId,
      rating: product.rating,
      sold: product.sold,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan yang tidak diketahui.";

    const status =
      message.includes("tidak ditemukan") || message.includes("dihapus")
        ? 404
        : message.includes("memblokir")
        ? 503
        : message.includes("timeout")
        ? 504
        : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
