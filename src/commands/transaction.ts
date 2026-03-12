import { Context, InlineKeyboard } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';
import { sessionManager } from '../utils/session-manager.js';
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

    // Format transaction message
    const message = formatTransaction(transaction);

    // Store transaction in session (avoid Telegram callback_data size limit)
    const sessionId = sessionManager.storeTransaction(transaction);

    // Organize categories by group
    const categoriesByGroup = new Map<string, typeof categories>();
    const ungroupedCategories: typeof categories = [];

    for (const category of categories) {
      if (category.group_id) {
        if (!categoriesByGroup.has(category.group_id)) {
          categoriesByGroup.set(category.group_id, []);
        }
        categoriesByGroup.get(category.group_id)!.push(category);
      } else {
        ungroupedCategories.push(category);
      }
    }

    // Build inline keyboard with grouped categories
    const keyboard = new InlineKeyboard();

    // Process each group
    for (const [groupId, groupCategories] of categoriesByGroup.entries()) {
      const groupName = categoryGroups.get(groupId) || groupId;
      
      // Add group header as a single button (non-functional, just for display)
      keyboard.text(`📁 ${groupName}`, `group_${groupId}`);
      keyboard.row();

      // Add category buttons (2 per row)
      for (let i = 0; i < groupCategories.length; i += 2) {
        const cat1 = groupCategories[i];
        const cat2 = groupCategories[i + 1];

        // Button 1
        keyboard.text(
          cat1.name,
          `cat_${sessionId}_${cat1.id}`
        );

        // Button 2 (if exists)
        if (cat2) {
          keyboard.text(
            cat2.name,
            `cat_${sessionId}_${cat2.id}`
          );
        }

        // New row (except for last in group)
        if (i + 2 < groupCategories.length) {
          keyboard.row();
        }
      }

      // Separator row between groups
      keyboard.row();
    }

    // Add ungrouped categories if any
    if (ungroupedCategories.length > 0) {
      keyboard.text('📁 Other', `group_uncategorized`);
      keyboard.row();

      for (let i = 0; i < ungroupedCategories.length; i += 2) {
        const cat1 = ungroupedCategories[i];
        const cat2 = ungroupedCategories[i + 1];

        keyboard.text(
          cat1.name,
          `cat_${sessionId}_${cat1.id}`
        );

        if (cat2) {
          keyboard.text(
            cat2.name,
            `cat_${sessionId}_${cat2.id}`
          );
        }

        if (i + 2 < ungroupedCategories.length) {
          keyboard.row();
        }
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
