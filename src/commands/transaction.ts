import { Context } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';
import { sessionManager } from '../utils/session-manager.js';
import {
  formatTransaction,
  formatError,
  buildGroupKeyboard,
} from '../utils/message-formatter.js';

/**
 * Handle /transaction command
 * Fetch first uncategorized transaction and display with category buttons
 */
export async function handleTransactionCommand(
  ctx: Context,
  actualApi: ActualApiService
): Promise<void> {
  try {
    // Fetch uncategorized transactions
    const transactions = await actualApi.getUncategorizedTransactions();

    // Check if there are any uncategorized transactions
    if (transactions.length === 0) {
      await ctx.reply(
        '✅ <b>All set!</b>\n\nNo uncategorized transactions found.',
        { parse_mode: 'HTML' }
      );
      return;
    }

    // Get first transaction
    const transaction = transactions[0];

    // Fetch categories and category groups
    const categories = await actualApi.getCategories();
    const categoryGroups = await actualApi.getCategoryGroups();

    if (categories.length === 0) {
      await ctx.reply(
        '❌ No categories available in your budget.',
        { parse_mode: 'HTML' }
      );
      return;
    }

    // Fetch account name for the transaction
    let accountName: string | undefined;
    try {
      const account = await actualApi.getAccount(transaction.account_id);
      accountName = account.name;
    } catch (error) {
      console.warn(`Could not fetch account name for ${transaction.account_id}:`, error);
      // Continue without account name - will show "Unknown Account"
    }

    // Format transaction message with account name
    const message = formatTransaction(transaction, accountName);

    // Store transaction in session (avoid Telegram callback_data size limit)
    const sessionId = sessionManager.storeTransaction(transaction);

    // Build group-selection keyboard (step 1 of 2-step flow)
    const keyboard = buildGroupKeyboard(categories, categoryGroups, sessionId);

    // Send message with keyboard
    await ctx.reply(message, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Error handling /transaction command:', error);
    const errorMessage = formatError(error instanceof Error ? error : 'Unknown error');
    await ctx.reply(errorMessage, { parse_mode: 'HTML' });
  }
}
