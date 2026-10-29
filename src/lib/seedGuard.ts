/** True for Turso / libSQL / http database URLs. file: SQLite is local. */
export function isRemoteDatabaseUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed || trimmed.startsWith("file:")) return false;
  return (
    trimmed.startsWith("libsql:") ||
    trimmed.startsWith("https:") ||
    trimmed.startsWith("http:") ||
    trimmed.startsWith("postgres:") ||
    trimmed.startsWith("postgresql:") ||
    trimmed.includes("turso")
  );
}

/**
 * Refuses to seed a remote database unless SEED_ALLOW_REMOTE=1.
 * The seed itself only inserts missing global foods — it never deletes
 * meals, foods, or custom foods. The flag is a second lock so a Turso
 * URL in the environment cannot start a catalog write by accident.
 */
export function assertSafeToSeed(url: string | undefined | null): void {
  if (isRemoteDatabaseUrl(url) && process.env.SEED_ALLOW_REMOTE !== "1") {
    throw new Error(
      "Refusing to seed a remote database. The seed never deletes meals or foods, " +
        "but it will insert missing global foods. Set SEED_ALLOW_REMOTE=1 to run it " +
        "against this DATABASE_URL on purpose.",
    );
  }
}
