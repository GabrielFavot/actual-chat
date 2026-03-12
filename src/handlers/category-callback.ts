import { Context } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';
import { sessionManager } from '../utils/session-manager.js';
import {
  formatSuccess,
  formatError,
  buildGroupKeyboard,
  buildGroupCategoryKeyboard,
} from '../utils/message-formatter.js';

/**
 * Handle all category-related callback queries.
 *
 * 2-step categorization flow:
 *   Step 1 — grp_{sessionId}_{groupId} : user tapped a group → edit message to show that group's categories
 *   Step 2 — cat_{sessionId}_{catId}   : user tapped a category → categorize & confirm
 *   Back   — back_{sessionId}          : return to group list
 *
 * Group IDs are arbitrary UUIDs except the special value "ungrouped".
 */
export async function handleCategoryCallback(
  ctx: Context,
  actualApi: ActualApiService
): Promise<void> {
  const callbackData = ctx.callbackQuery?.data;
  if (!callbackData) return;

  // ── Step 1: group selected ────────────────────────────────────────────────
  if (callbackData.startsWith('grp_')) {
    await handleGroupSelected(ctx, actualApi, callbackData);
    return;
  }

  // ── Back: return to group list ────────────────────────────────────────────
  if (callbackData.startsWith('back_')) {
    await handleBack(ctx, actualApi, callbackData);
    return;
  }

  // ── Step 2: category selected ─────────────────────────────────────────────
  if (callbackData.startsWith('cat_')) {
    await handleCategorySelected(ctx, actualApi, callbackData);
    return;
  }

  // Unknown callback — silently ignore
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse sessionId from a callback string.
 * Format: {prefix}_{sessionPart1}_{sessionPart2}[_{rest...}]
 * SessionId is always "txn_N" (two underscore-separated parts).
 */
function parseSessionId(parts: string[]): string {
  // parts[0] = prefix (grp|back|cat), parts[1..2] = sessionId ("txn", N)
  return `${parts[1]}_${parts[2]}`;
}

async function handleGroupSelected(
  ctx: Context,
  actualApi: ActualApiService,
  callbackData: string
): Promise<void> {
  try {
    // Format: grp_{sessionId}_{groupId}
    // groupId may contain hyphens (UUID) — everything after sessionId
    const parts = callbackData.split('_');
    if (parts.length < 4) throw new Error('Invalid grp_ callback format');

    const sessionId = parseSessionId(parts);
    const groupId = parts.slice(3).join('_');

    const transaction = sessionManager.getTransaction(sessionId);
    if (!transaction) {
      await ctx.answerCallbackQuery({ text: '⏳ Session expired — use /transaction', show_alert: true });
      return;
    }

    await ctx.answerCallbackQuery({ text: '📁 Loading categories…', show_alert: false });

    const categories = await actualApi.getCategories();
    const categoryGroups = await actualApi.getCategoryGroups();

    const groupName =
      groupId === 'ungrouped'
        ? 'Other'
        : (categoryGroups.get(groupId) || groupId);

    const keyboard = buildGroupCategoryKeyboard(categories, groupId, groupName, sessionId);

    // Edit the existing message in place — no new message sent
    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
  } catch (error) {
    console.error('Error handling group selection:', error);
    try {
      await ctx.answerCallbackQuery({ text: '❌ Error loading categories', show_alert: true });
    } catch (_) { /* ignore */ }
  }
}

async function handleBack(
  ctx: Context,
  actualApi: ActualApiService,
  callbackData: string
): Promise<void> {
  try {
    // Format: back_{sessionId}
    const parts = callbackData.split('_');
    if (parts.length < 3) throw new Error('Invalid back_ callback format');

    const sessionId = parseSessionId(parts);

    const transaction = sessionManager.getTransaction(sessionId);
    if (!transaction) {
      await ctx.answerCallbackQuery({ text: '⏳ Session expired — use /transaction', show_alert: true });
      return;
    }

    await ctx.answerCallbackQuery({ text: '↩ Back to groups', show_alert: false });

    const categories = await actualApi.getCategories();
    const categoryGroups = await actualApi.getCategoryGroups();

    const keyboard = buildGroupKeyboard(categories, categoryGroups, sessionId);
    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
  } catch (error) {
    console.error('Error handling back navigation:', error);
    try {
      await ctx.answerCallbackQuery({ text: '❌ Error', show_alert: true });
    } catch (_) { /* ignore */ }
  }
}

async function handleCategorySelected(
  ctx: Context,
  actualApi: ActualApiService,
  callbackData: string
): Promise<void> {
  try {
    // Format: cat_{sessionId}_{categoryId}  (categoryId is a UUID with hyphens)
    const parts = callbackData.split('_');
    if (parts.length < 4) throw new Error('Invalid cat_ callback format');

    const sessionId = parseSessionId(parts);
    const categoryId = parts.slice(3).join('_');

    const transaction = sessionManager.getTransaction(sessionId);
    if (!transaction) {
      throw new Error('Transaction session expired or not found. Please use /transaction again.');
    }

    await ctx.answerCallbackQuery({ text: '⏳ Categorizing…', show_alert: false });

    // Verify category exists
    const categories = await actualApi.getCategories();
    const category = categories.find((c) => c.id === categoryId);
    if (!category) throw new Error(`Category not found: ${categoryId}`);

    // Update in ActualBudget
    await actualApi.updateTransaction(transaction.id, categoryId);

    // Resolve payee name
    const payeeMap = await actualApi.getPayeesMap();
    const payeeName = transaction.payee
      ? (payeeMap.get(transaction.payee) || transaction.payee_name || 'Transaction')
      : (transaction.payee_name || 'Transaction');

    const successMessage = formatSuccess(payeeName, category.name, transaction.amount);

    // Delete the message with buttons, then send confirmation
    try {
      await ctx.deleteMessage();
    } catch (_) {
      console.log('Could not delete message (may already be gone)');
    }

    await ctx.reply(successMessage, { parse_mode: 'HTML' });

    sessionManager.clearSession(sessionId);

    console.log(`✓ Transaction ${transaction.id} categorized as ${category.name}`);
  } catch (error) {
    console.error('Error handling category selection:', error);
    try {
      await ctx.answerCallbackQuery({ text: '❌ Error', show_alert: true });
      const errorMessage = formatError(error instanceof Error ? error : 'Unknown error');
      await ctx.reply(errorMessage, { parse_mode: 'HTML' });
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}
