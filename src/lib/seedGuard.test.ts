import { afterEach, describe, expect, it } from "vitest";
import { assertSafeToSeed, isRemoteDatabaseUrl } from "@/lib/seedGuard";

describe("seed guard", () => {
  const previous = process.env.SEED_ALLOW_REMOTE;

  afterEach(() => {
    if (previous === undefined) delete process.env.SEED_ALLOW_REMOTE;
    else process.env.SEED_ALLOW_REMOTE = previous;
  });

  it("treats file sqlite as local and libsql/https as remote", () => {
    expect(isRemoteDatabaseUrl("file:./dev.db")).toBe(false);
    expect(isRemoteDatabaseUrl(undefined)).toBe(false);
    expect(isRemoteDatabaseUrl("libsql://diet-urtop.turso.io")).toBe(true);
    expect(isRemoteDatabaseUrl("https://diet-urtop.turso.io")).toBe(true);
  });

  it("refuses a remote url unless explicitly allowed", () => {
    delete process.env.SEED_ALLOW_REMOTE;
    expect(() => assertSafeToSeed("libsql://diet.turso.io")).toThrow(/SEED_ALLOW_REMOTE/);
    expect(() => assertSafeToSeed("file:./dev.db")).not.toThrow();
    process.env.SEED_ALLOW_REMOTE = "1";
    expect(() => assertSafeToSeed("libsql://diet.turso.io")).not.toThrow();
  });
});
