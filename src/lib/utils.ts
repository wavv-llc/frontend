import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to merge class names for tailwindcss and clsx

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a Date object as a date-only string (YYYY-MM-DD) using local time.
 * Avoids timezone shift that occurs with Date.toISOString() (which uses UTC).
 */
export function formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse a date-only string (YYYY-MM-DD) or ISO datetime string into a local Date
 * without timezone shift. Returns a Date set to midnight local time for the given date.
 */
export function parseDateOnly(dateStr: string): Date {
    // Extract just the date portion (handles both "2026-03-17" and "2026-03-17T12:00:00.000Z")
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
}
