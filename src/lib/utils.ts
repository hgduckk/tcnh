import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Analytics } from "@vercel/analytics/next"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely extract a readable message from any thrown value.
 * Supabase errors are plain objects ({ message, code, details, hint }),
 * NOT Error instances, so String(e) produces "[object Object]".
 */
export function serializeError(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>
    if (typeof obj.message === "string") return obj.message
    return JSON.stringify(obj)
  }
  return String(e)
}
