import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

/**
 * Delete a user even when MealItem → Food is ON DELETE RESTRICT.
 * Custom foods cascade from the user, so rows that point at them have
 * to go first. That includes another user's meal item that logged this
 * user's custom food (custom foods are shareable).
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await prisma.$transaction(async (tx: Tx) => {
    await tx.mealItem.deleteMany({ where: { food: { userId } } });
    await tx.mealItem.deleteMany({ where: { meal: { userId } } });
    await tx.favoriteFood.deleteMany({
      where: { OR: [{ userId }, { food: { userId } }] },
    });
    await tx.meal.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });
}
