import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
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
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  items: z.array(mealItemSchema).min(1),
});

export const mealUpdateSchema = z.object({
  mealType: z.enum(MEAL_TYPES).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  items: z.array(mealItemSchema).min(1).optional(),
});

export const GENDERS = ["male", "female"] as const;
export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"] as const;
export const HEALTH_CONDITIONS = ["diabetes", "high_cholesterol", "hypertension"] as const;

const healthConditionsSchema = z
  .string()
  .max(200)
  .refine(
    (value) =>
      value
        .split(",")
        .filter(Boolean)
        .every((c) => (HEALTH_CONDITIONS as readonly string[]).includes(c)),
    { message: "Invalid health condition" },
  );

export const foodServingCreateSchema = z.object({
  unitName: z.string().trim().min(1).max(30),
  gramsPerUnit: z.number().positive().finite().max(5000),
});

export const foodCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  nameEn: z.string().trim().max(100).optional().nullable(),
  category: z.string().trim().min(1).max(50).default("general"),
  subcategory: z.string().trim().max(50).optional().nullable(),
  caloriesPer100g: z.number().min(0).max(2000),
  proteinPer100g: z.number().min(0).max(200),
  fatPer100g: z.number().min(0).max(200),
  carbsPer100g: z.number().min(0).max(200),
  sodiumPer100g: z.number().min(0).max(20000).optional().nullable(),
  servings: z.array(foodServingCreateSchema).min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const profileUpdateSchema = z.object({
  age: z.number().int().min(1).max(120).optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  height: z.number().min(30).max(272).optional().nullable(),
  weight: z.number().min(20).max(500).optional().nullable(),
  goalWeight: z.number().min(20).max(500).optional().nullable(),
  activityLevel: z.enum(ACTIVITY_LEVELS).optional().nullable(),
  healthConditions: healthConditionsSchema.optional().nullable(),
  targetsManual: z.boolean().optional(),
  dailyTarget: z.number().min(800).max(10000).optional().nullable(),
  proteinTarget: z.number().min(0).max(500).optional().nullable(),
  fatTarget: z.number().min(0).max(500).optional().nullable(),
  carbsTarget: z.number().min(0).max(1000).optional().nullable(),
  sodiumTarget: z.number().min(0).max(10000).optional().nullable(),
  waterTargetMl: z.number().int().min(0).max(10000).optional().nullable(),
  onboardingDone: z.boolean().optional(),
  name: z.string().trim().max(100).optional().nullable(),
});

export const weightLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weight: z.number().min(20).max(500),
});

export const waterLogSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    ml: z.number().int().min(0).max(20000).optional(),
    deltaMl: z.number().int().min(-5000).max(5000).optional(),
  })
  .refine((v) => v.ml != null || v.deltaMl != null, {
    message: "ml or deltaMl is required",
  });

export const favoriteSchema = z.object({
  foodId: z.string().min(1),
});

export const exerciseLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  calories: z.number().int().min(0).max(20000),
});

export const healthSyncSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  activeCalories: z.number().int().min(0).max(20000),
});
