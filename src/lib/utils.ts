import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A message safe to show users from a thrown Convex error. ConvexError carries a
 * user-facing string in `data` (e.g. plan-limit messages); anything else falls back.
 */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const data = (err as { data?: unknown } | null)?.data;
  if (typeof data === "string" && data) return data;
  return fallback;
}
