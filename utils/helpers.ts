/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string to a short format (e.g., "Jan 5").
 */
export function formatDateShort(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Check if a date is today.
 */
export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the future.
 */
export function isFuture(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Get the zodiac sign from a birth date string or month/day.
 */
export function getZodiacSign(month: number, day: number): string {
  const signs = [
    { sign: 'Capricorn', end: [1, 19] },
    { sign: 'Aquarius', end: [2, 18] },
    { sign: 'Pisces', end: [3, 20] },
    { sign: 'Aries', end: [4, 19] },
    { sign: 'Taurus', end: [5, 20] },
    { sign: 'Gemini', end: [6, 20] },
    { sign: 'Cancer', end: [7, 22] },
    { sign: 'Leo', end: [8, 22] },
    { sign: 'Virgo', end: [9, 22] },
    { sign: 'Libra', end: [10, 22] },
    { sign: 'Scorpio', end: [11, 21] },
    { sign: 'Sagittarius', end: [12, 21] },
  ];

  for (const { sign, end } of signs) {
    if (month < end[0] || (month === end[0] && day <= end[1])) {
      return sign;
    }
  }
  return 'Capricorn';
}

/**
 * Get a zodiac emoji.
 */
/**
 * Get a zodiac icon name (Ionicons).
 */
export function getZodiacIcon(sign: string): string {
  const icons: Record<string, string> = {
    Aries: 'flame-outline',
    Taurus: 'leaf-outline',
    Gemini: 'people-outline',
    Cancer: 'moon-outline',
    Leo: 'sunny-outline',
    Virgo: 'flower-outline',
    Libra: 'scale-outline',
    Scorpio: 'bug-outline',
    Sagittarius: 'navigate-outline',
    Capricorn: 'trending-up-outline',
    Aquarius: 'water-outline',
    Pisces: 'fish-outline',
  };
  return icons[sign] || 'star-outline';
}

/**
 * Get initials from a name.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
