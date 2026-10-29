/**
 * JWT revocation. Missing token version matches a user still at 0 so
 * sessions issued before this field existed stay valid until password
 * change or account deletion bumps or removes the row.
 */
export function isTokenVersionCurrent(
  tokenVersion: number | undefined,
  dbVersion: number | null,
): boolean {
  if (dbVersion == null) return false;
  return (tokenVersion ?? 0) === dbVersion;
}
