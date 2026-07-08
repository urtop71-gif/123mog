import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(200),
  name: z.string().trim().max(100).optional().nullable(),
});

export const mealItemSchema = z.object({
  foodId: z.string().min(1),
  quantity: z.number().positive().finite(),
  unitName: z.string().min(1),
});

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export const mealCreateSchema = z.object({
  mealType: z.enum(MEAL_TYPES),
  date: z.string().optional().nullable(),
  items: z.array(mealItemSchema).min(1),
});

export const mealUpdateSchema = z.object({
  mealType: z.enum(MEAL_TYPES).optional(),
  date: z.string().optional().nullable(),
  items: z.array(mealItemSchema).optional(),
});

export const GENDERS = ["male", "female"] as const;
export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"] as const;
export const HEALTH_CONDITIONS = ["diabetes", "high_cholesterol", "hypertension"] as const;

const healthConditionsSchema = z
  .string()
  .max(200)
  .refine(
    (value) => value.split(",").filter(Boolean).every((c) => (HEALTH_CONDITIONS as readonly string[]).includes(c)),
    { message: "Invalid health condition" }
  );

export const profileUpdateSchema = z.object({
  age: z.number().int().min(1).max(120).optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  height: z.number().min(30).max(272).optional().nullable(),
  weight: z.number().min(20).max(500).optional().nullable(),
  goalWeight: z.number().min(20).max(500).optional().nullable(),
  activityLevel: z.enum(ACTIVITY_LEVELS).optional().nullable(),
  healthConditions: healthConditionsSchema.optional().nullable(),
});
