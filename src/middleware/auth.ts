import { Context, MiddlewareFn } from 'grammy';
import { logUnauthorizedAttempt } from '../utils/logger.js';

/**
 * Parse and validate TELEGRAM_USER_ID environment variable
 */
function parseAuthorizedUserId(): number {
  const envVar = process.env.TELEGRAM_USER_ID;

  if (!envVar) {
    throw new Error('TELEGRAM_USER_ID environment variable is required');
  }

  const num = Number(envVar.trim());
  if (isNaN(num)) {
    throw new Error(`Invalid TELEGRAM_USER_ID: "${envVar.trim()}" - must be a number`);
  }

  return num;
}

// Parse and validate at module load time
export const authorizedUserId: number = parseAuthorizedUserId();

/**
 * Check if a user ID is authorized
 */
export function isAuthorized(userId: number): boolean {
  return userId === authorizedUserId;
}

/**
 * Authorization middleware for grammY
 * Silently ignores unauthorized users but logs the attempt
 */
export const authMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const user = ctx.from;

  // If no user, ignore (shouldn't happen in normal bot usage)
  if (!user) {
    return;
  }

  if (!isAuthorized(user.id)) {
    logUnauthorizedAttempt(user.id, user.username, user.first_name);
    return;
  }

  await next();
};
