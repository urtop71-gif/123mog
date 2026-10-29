import { describe, expect, it } from "vitest";
import {
  MAX_UNCOMPRESSED_BYTES,
  PhotoRejected,
  prepareMealPhoto,
  sniffImageMime,
} from "@/lib/imageCompress";

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x11]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

describe("sniffImageMime", () => {
  it("recognizes jpeg, png, and falls back to jpeg", () => {
    expect(sniffImageMime(jpeg)).toBe("image/jpeg");
    expect(sniffImageMime(png)).toBe("image/png");
    expect(sniffImageMime(Buffer.from("not an image"))).toBe("image/jpeg");
  });
});

describe("prepareMealPhoto", () => {
  it("returns the compressed jpeg when sharp works", async () => {
    const result = await prepareMealPhoto(jpeg, async () => Buffer.from([0xff, 0xd8, 0xff, 0x01]));
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.buffer[2]).toBe(0xff);
  });

  it("passes a small original through when compression throws", async () => {
    const result = await prepareMealPhoto(jpeg, async () => {
      throw new Error("Could not load the sharp module");
    });
    expect(result.buffer).toBe(jpeg);
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("rejects a large original when compression is unavailable", async () => {
    const big = Buffer.alloc(MAX_UNCOMPRESSED_BYTES + 1, 1);
    big[0] = 0xff;
    big[1] = 0xd8;
    big[2] = 0xff;
    await expect(
      prepareMealPhoto(big, async () => {
        throw new Error("libvips-cpp.so.8: cannot open shared object file");
      }),
    ).rejects.toMatchObject({ name: "PhotoRejected", code: "too_large" });
  });

  it("rejects an empty upload before calling compression", async () => {
    let called = false;
    await expect(
      prepareMealPhoto(Buffer.alloc(0), async () => {
        called = true;
        return jpeg;
      }),
    ).rejects.toBeInstanceOf(PhotoRejected);
    expect(called).toBe(false);
  });
});
