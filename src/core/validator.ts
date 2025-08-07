import { z } from "zod";
import { Profile, BPod } from "../types";

export const DEFAULT_LOGO = "https://cdn.breeth.com/default-logo.png";

export const profileSchema = z.object({
  name: z.string().min(1, "Profile name is required"),
  logo: z
    .string()
    .url()
    .startsWith("https://")
    .optional()
    .default(DEFAULT_LOGO),
  description: z.string().max(500, "Description cannot exceed 500 characters"),
  website: z.string().url().startsWith("https://").optional(),
  contact: z.string().optional(),
});

const inputSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum([
      "text",
      "textarea",
      "number",
      "checkbox",
      "radio",
      "dropdown",
      "toggle",
      "hidden",
    ]),
    label: z.string().optional(),
    options: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (
        (data.type === "radio" || data.type === "dropdown") &&
        !data.options
      ) {
        return false;
      }
      return true;
    },
    { message: "Radio and dropdown inputs require options" }
  );

const apiSchema = z
  .object({
    url: z
      .string()
      .url()
      .startsWith("https://", "API URL must start with https://"),
    method: z.enum(["GET", "POST"]),
    fileParams: z.array(z.string()),
    bodyTemplate: z.record(z.string(), z.string()),
    responseType: z.enum(["file", "json"]),
  })
  .refine(
    (data) => {
      return Object.values(data.bodyTemplate).includes("{webhook_url}");
    },
    { message: "bodyTemplate must include {webhook_url}" }
  );

export const bPodSchema = z.object({
  name: z.string().min(1, "BPod name is required"),
  accepts: z
    .array(
      z
        .string()
        .regex(/^[a-z0-9]+$/, "File extension must be lowercase without dot")
    )
    .nonempty(),
  inputs: z.array(inputSchema).optional(),
  submit: z.object({
    label: z.string().min(1),
    action: z.string().min(1),
  }),
  api: apiSchema,
});

export function validateProfile(profile: Profile) {
  const parsed = profileSchema.safeParse(profile);
  if (parsed.success && !parsed.data.logo) parsed.data.logo = DEFAULT_LOGO;
  return parsed;
}

export function validateBPod(bPod: BPod) {
  return bPodSchema.safeParse(bPod);
}
