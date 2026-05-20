const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image'));
    image.src = src;
  });

const canvasToDataUrl = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<string>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(canvas.toDataURL('image/jpeg', quality));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      },
      type,
      quality
    );
  });

export async function compressImageFile(
  file: File,
  options: { maxSize?: number; quality?: number } = {}
) {
  const maxSize = options.maxSize ?? 320;
  const quality = options.quality ?? 0.72;
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return source;

  ctx.drawImage(image, 0, 0, width, height);

  return canvasToDataUrl(canvas, 'image/webp', quality);
}
