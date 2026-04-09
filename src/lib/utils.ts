import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

/**
 * Merge Tailwind CSS classes with clsx for conditional class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string.
 * Defaults to "MMM DD, YYYY" format (e.g., "Apr 08, 2026").
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return "Invalid date";
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  };

  return d.toLocaleDateString("en-US", options ?? defaultOptions);
}

/**
 * Format a file size in bytes to a human-readable string.
 * e.g., 1024 -> "1.00 KB", 1048576 -> "1.00 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/**
 * Generate a UUID v4 string.
 */
export function generateId(): string {
  return uuidv4();
}
