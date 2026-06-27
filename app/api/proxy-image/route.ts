import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_DOMAINS = [
  "cf.shopee.co.id",
  "shopee.co.id",
  "down-id.img.susercontent.com",
  "down.img.susercontent.com",
  "img.susercontent.com",
  "susercontent.com",
];

function isAllowedDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)
    );
  } catch { return false; }
}

export async function GET(request: NextRequest) {
  const imageUrl = new URL(request.url).searchParams.get("url");
  if (!imageUrl) return NextResponse.json({ error: "URL required" }, { status: 400 });
  if (!isAllowedDomain(imageUrl)) return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://shopee.co.id/",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok) return NextResponse.json({ error: `Upstream error: ${response.status}` }, { status: response.status });

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
