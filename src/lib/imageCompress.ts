import sharp from "sharp";

const MAX_INPUT_BYTES = 8 * 1024 * 1024;

/** Downscale a meal photo before it is sent to the model. */
export async function compressMealPhoto(input: Buffer): Promise<Buffer> {
  if (input.length === 0) throw new Error("Empty image");
  if (input.length > MAX_INPUT_BYTES) throw new Error("Image is too large");
  return sharp(input, { failOn: "none", limitInputPixels: 24_000_000 })
    .rotate()
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
}
