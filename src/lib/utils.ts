import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse JSON response with proper typing
 * Handles untyped JSON from response.json()
 */
export async function parseResponse<T = unknown>(
  response: Response
): Promise<T> {
  return (await response.json()) as T;
}

/**
 * Safely access unknown JSON object properties
 */
export function safeGet<T = unknown>(
  obj: unknown,
  key: string,
  defaultValue?: T
): T | undefined {
  const result = (obj as Record<string, unknown>)?.[key];
  return result !== undefined ? (result as T) : defaultValue;
}
