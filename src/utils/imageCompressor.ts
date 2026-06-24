/**
 * 图片压缩工具
 * 超过阈值时自动压缩为 WebP 格式，尺寸限制在 1920px 内，质量 0.85
 */

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_DIMENSION = 1920;             // 最长边像素上限
const WEBP_QUALITY = 0.85;

/**
 * 若图片文件 > 1MB，则通过 canvas 压缩为 WebP（≤1920px，质量 0.85）。
 * 否则直接返回原文件。
 *
 * @param file 原始图片文件
 * @returns 压缩后的 Blob（或原文件）
 */
export async function compressImage(file: File): Promise<Blob> {
  if (file.size <= MAX_SIZE_BYTES) return file;

  return new Promise<Blob>((resolve) => {
    const img = new Image();
    const tempUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(tempUrl); // 临时 URL 用完立即释放

      let { width, height } = img;
      // 等比缩放，使最长边 ≤ MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(blob ?? file), // 若 canvas 失败，降级返回原文件
        'image/webp',
        WEBP_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      resolve(file); // 加载失败时降级返回原文件
    };

    img.src = tempUrl;
  });
}
