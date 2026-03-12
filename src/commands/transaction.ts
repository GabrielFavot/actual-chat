import { Context, InlineKeyboard } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';
import {
  formatTransaction,
  formatError,
  formatAmount
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

    // Fetch categories
    const categories = await actualApi.getCategories();

    if (categories.length === 0) {
      await ctx.reply(
        '❌ No categories available in your budget.',
        { parse_mode: 'HTML' }
      );
      return;
    }

    // Format transaction message
    const message = formatTransaction(transaction);

    // Build inline keyboard with categories
    const keyboard = new InlineKeyboard();

    // Add category buttons (2 per row for mobile friendliness)
    for (let i = 0; i < categories.length; i += 2) {
      const cat1 = categories[i];
      const cat2 = categories[i + 1];

      // Button 1
      keyboard.text(
        cat1.name,
        `cat_${cat1.id}_${transaction.id}`
      );

      // Button 2 (if exists)
      if (cat2) {
        keyboard.text(
          cat2.name,
          `cat_${cat2.id}_${transaction.id}`
        );
      }

      // New row (except for last)
      if (i + 2 < categories.length) {
        keyboard.row();
      }
    }

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
