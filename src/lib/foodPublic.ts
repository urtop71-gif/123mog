/** API shape for a food. `userId` is never sent to the client. */
export function toPublicFood<T extends { userId?: string | null; user?: unknown }>(
  food: T,
  viewerId?: string | null,
): Omit<T, "userId" | "user"> & { isOwner: boolean } {
  const { userId, ...rest } = food;
  delete (rest as { user?: unknown }).user;
  return {
    ...(rest as Omit<T, "userId" | "user">),
    isOwner: !!viewerId && !!userId && userId === viewerId,
  };
}
