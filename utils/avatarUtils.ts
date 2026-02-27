
/**
 * Utility functions for generating initials avatars
 */

/**
 * Get initials from first and last name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Two-letter initials (uppercase)
 */
export function getInitials(firstName: string, lastName: string): string {
  const firstInitial = (firstName || '').trim()[0] || '';
  const lastInitial = (lastName || '').trim()[0] || '';
  const initials = firstInitial + lastInitial;
  return initials.toUpperCase();
}

/**
 * Generate a consistent color based on a name
 * Uses a simple hash function to ensure the same name always gets the same color
 * @param name - Full name or any string to generate color from
 * @returns Hex color code
 */
export function generateConsistentColor(name: string): string {
  // Predefined color palette for avatars
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Orange
    '#52B788', // Green
    '#E76F51', // Coral
    '#2A9D8F', // Dark Teal
    '#E9C46A', // Gold
    '#F4A261', // Sandy Brown
    '#264653', // Dark Blue
  ];

  // Simple hash function
  let hash = 0;
  const cleanName = (name || '').toLowerCase().trim();
  
  for (let i = 0; i < cleanName.length; i++) {
    const char = cleanName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get consistent index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
