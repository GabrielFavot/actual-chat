/**
 * Logging utility for security events
 */

/**
 * Logs unauthorized access attempts for security monitoring
 * @param userId - The Telegram user ID that attempted to access
 * @param username - Optional Telegram username
 * @param firstName - Optional user's first name
 */
export function logUnauthorizedAttempt(
  userId: number,
  username?: string,
  firstName?: string
): void {
  const timestamp = new Date().toISOString();
  console.log(
    `[UNAUTHORIZED] ${timestamp} - User: ${userId} | Username: ${username || 'N/A'} | Name: ${firstName || 'N/A'}`
  );
}
