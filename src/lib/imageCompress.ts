export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
/** Original bytes we will send when sharp cannot load or compress. */
export const MAX_UNCOMPRESSED_BYTES = 1_500_000;

export class PhotoRejected extends Error {
  constructor(readonly code: "empty" | "too_large") {
    super(code);
    this.name = "PhotoRejected";
  }
}

export function sniffImageMime(input: Buffer): string {
  if (input.length >= 3 && input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    input.length >= 8 &&
    input[0] === 0x89 &&
    input[1] === 0x50 &&
    input[2] === 0x4e &&
    input[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    input.length >= 12 &&
    input.subarray(0, 4).toString("ascii") === "RIFF" &&
    input.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (input.length >= 6) {
    const head = input.subarray(0, 6).toString("ascii");
    if (head === "GIF87a" || head === "GIF89a") return "image/gif";
  }
  return "image/jpeg";
}

async function compressWithSharp(input: Buffer): Promise<Buffer> {
  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;
  return sharp(input, { failOn: "none", limitInputPixels: 24_000_000 })
    .rotate()
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
}

/**
 * Resize a meal photo. sharp is imported only when this runs, so a missing
 * native binary cannot take down the route. If compression fails, a small
 * original is passed through; a large one is rejected.
 */
export async function prepareMealPhoto(
  input: Buffer,
  compress: (input: Buffer) => Promise<Buffer> = compressWithSharp,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (input.length === 0) throw new PhotoRejected("empty");
  if (input.length > MAX_PHOTO_BYTES) throw new PhotoRejected("too_large");

  try {
    const buffer = await compress(input);
    if (buffer.length === 0) throw new Error("empty compression result");
    return { buffer, mimeType: "image/jpeg" };
  } catch (error) {
    if (error instanceof PhotoRejected) throw error;
    console.error(
      "Meal photo compression unavailable:",
      error instanceof Error ? error.message : error,
    );
    if (input.length <= MAX_UNCOMPRESSED_BYTES) {
      return { buffer: input, mimeType: sniffImageMime(input) };
    }
    throw new PhotoRejected("too_large");
  }
}
