import { Context, NextFunction, MiddlewareFn } from 'grammy';
import { logUnauthorizedAttempt } from '../utils/logger.js';

/**
 * Parse and validate AUTHORIZED_USER_IDS environment variable
 */
function parseAuthorizedUserIds(): number[] {
  const envVar = process.env.AUTHORIZED_USER_IDS;

  if (!envVar) {
    throw new Error('AUTHORIZED_USER_IDS environment variable is required');
  }

  const ids = envVar.split(',').map((id) => {
    const trimmed = id.trim();
    const num = Number(trimmed);
    if (isNaN(num)) {
      throw new Error(`Invalid user ID in AUTHORIZED_USER_IDS: "${trimmed}" - must be a number`);
    }
    return num;
  });

  return ids;
}

// Parse and validate at module load time
export const authorizedUserIds: number[] = parseAuthorizedUserIds();

/**
 * Check if a user ID is authorized
 */
export function isAuthorized(userId: number): boolean {
  return authorizedUserIds.includes(userId);
}

/**
 * Authorization middleware for grammY
 * Silently ignores unauthorized users but logs the attempt
 */
export const authMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  // Get user from context
  const user = ctx.from;

  // If no user, ignore (shouldn't happen in normal bot usage)
  if (!user) {
    return;
  }

  // Check if user is authorized
  if (!isAuthorized(user.id)) {
    // Log the unauthorized attempt for security monitoring
    logUnauthorizedAttempt(user.id, user.username, user.first_name);
    // Silently ignore - no response sent
    return;
  }

  // User is authorized, continue to next middleware/handler
  await next();
};
