/**
 * ID generation utilities
 */

/**
 * Generate a unique ID with a given prefix
 */
export const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Generate a unique player ID
 */
export const generatePlayerId = (): string => {
  return generateId("player");
};

/**
 * Create a bullet ID generator with auto-incrementing counter
 */
export const createBulletIdGenerator = () => {
  let counter = 0;
  return () => `bullet_${counter++}`;
};
