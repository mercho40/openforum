import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Converts a string to a URL-friendly slug
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 * - Handles accented characters
 * - Ensures URL safety
 * 
 * @param text The string to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFKD') // Normalize to decomposed form for handling accents
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .toLowerCase() // Convert to lowercase
    .trim() // Remove whitespace from ends
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters (except hyphens)
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single hyphen
    .replace(/^-+/, '') // Remove hyphens from start
    .replace(/-+$/, ''); // Remove hyphens from end
}

/**
 * Generates a unique slug by appending a number if needed
 * 
 * @param text Base text to slugify
 * @param existingSlugs Array of existing slugs to check against
 * @returns A unique slug
 */
export function generateUniqueSlug(text: string, existingSlugs: string[]): string {
  const slug = slugify(text);
  let uniqueSlug = slug;
  let counter = 1;

  // Keep checking and incrementing counter until we have a unique slug
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}
