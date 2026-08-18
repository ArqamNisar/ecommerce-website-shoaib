/**
 * TechHaven — Utility Functions
 */

/**
 * Format a price as USD currency.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Calculate discount percentage.
 */
export function getDiscountPercent(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

/**
 * Generate or retrieve a unique session ID for the user.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sessionId = sessionStorage.getItem('techhaven_session');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('techhaven_session', sessionId);
  }
  return sessionId;
}

/**
 * Debounce a function call.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Render star rating as an array of star types.
 */
export function getStarRating(rating: number): ('full' | 'half' | 'empty')[] {
  const stars: ('full' | 'half' | 'empty')[] = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push('full');
    else if (rating >= i - 0.5) stars.push('half');
    else stars.push('empty');
  }
  return stars;
}

/**
 * Truncate text to a max length.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Get the list of product categories with icons.
 */
export const CATEGORIES = [
  { name: 'Mobile Accessories', icon: '📱', slug: 'mobile-accessories' },
  { name: 'Earbuds & Airpods', icon: '🎧', slug: 'earbuds-airpods' },
  { name: 'Smart Watches', icon: '⌚', slug: 'smart-watches' },
  { name: 'Electronic Gadgets', icon: '🔌', slug: 'electronic-gadgets' },
  { name: 'Flashlights & Searchlights', icon: '🔦', slug: 'flashlights-searchlights' },
  { name: 'TV Boxes', icon: '📦', slug: 'tv-boxes' },
  { name: 'Televisions', icon: '📺', slug: 'televisions' },
  { name: 'Bluetooth Soundbars & Audio', icon: '🔊', slug: 'bluetooth-soundbars-audio' },
];
