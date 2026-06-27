import JSZip from "jszip";

export interface DownloadProgress {
  current: number;
  total: number;
  percentage: number;
  currentFile: string;
}

export async function downloadImageAsBlob(url: string): Promise<Blob> {
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`Gagal mengunduh gambar: ${response.status}`);
  }

  return response.blob();
}

export async function downloadSingleImage(
  url: string,
  filename: string
): Promise<void> {
  const blob = await downloadImageAsBlob(url);
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function downloadAllAsZip(
  images: string[],
  productTitle: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  const zip = new JSZip();
  const total = images.length;

  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    const filename = `image_${String(i + 1).padStart(2, "0")}.jpg`;

    onProgress?.({
      current: i,
      total,
      percentage: Math.round((i / total) * 100),
      currentFile: filename,
    });

    try {
      const blob = await downloadImageAsBlob(url);
      zip.file(filename, blob);
    } catch (error) {
      console.error(`Gagal mengunduh ${filename}:`, error);
      // Continue with remaining images
    }
  }

  onProgress?.({
    current: total,
    total,
    percentage: 100,
    currentFile: "Membuat ZIP...",
  });

  const zipBlob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (metadata) => {
      onProgress?.({
        current: total,
        total,
        percentage: Math.round(metadata.percent),
        currentFile: "Membuat file ZIP...",
      });
    }
  );

  const safeTitle = productTitle
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .trim()
    .substring(0, 50) || "Shopee Product";

  const objectUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${safeTitle}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}
