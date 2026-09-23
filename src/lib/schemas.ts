import { z } from "zod";

export const genderFilterSchema = z.enum(["all", "boy", "girl", "unisex"]);

export const swipeDirectionSchema = z.enum(["pass", "like", "love"]);

export const createCoupleSchema = z.object({
  title: z.string().trim().min(1).max(60).optional(),
});

export const joinCoupleSchema = z.object({
  invite_code: z
    .string()
    .trim()
    .min(4)
    .max(12)
    .transform((code) => code.toUpperCase()),
});

export const updateCoupleSchema = z
  .object({
    title: z.string().trim().min(1).max(60).optional(),
    due_date: z.iso.date().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const updateProfileSchema = z
  .object({
    display_name: z.string().trim().min(1).max(40).optional(),
    avatar_emoji: z.string().trim().min(1).max(8).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const swipeSchema = z.object({
  name_id: z.uuid(),
  direction: swipeDirectionSchema,
});

export const createNameSchema = z.object({
  value: z.string().trim().min(1).max(40),
  gender: z.enum(["boy", "girl", "unisex"]),
  origin: z.string().trim().max(60).optional(),
  meaning: z.string().trim().max(120).optional(),
});

export const updateMatchSchema = z
  .object({
    shortlisted: z.boolean().optional(),
    note: z.string().trim().max(280).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const languageSchema = z.enum(["en", "es", "nl", "fr", "pt"]);

/**
 * Comma-separated language codes, e.g. "en,es,nl". A name is only dealt if a
 * native speaker of every listed language can pronounce it naturally.
 * Empty or missing means no filter.
 */
export const languageListSchema = z
  .string()
  .optional()
  .transform((raw) =>
    (raw ?? "")
      .split(",")
      .map((code) => code.trim().toLowerCase())
      .filter(Boolean),
  )
  .pipe(z.array(languageSchema).max(5));

export const deckQuerySchema = z.object({
  gender: genderFilterSchema.default("all"),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  languages: languageListSchema,
});

export const matchesQuerySchema = z.object({
  shortlisted: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  gender: genderFilterSchema.default("all"),
});
