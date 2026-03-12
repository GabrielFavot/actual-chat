import { Context } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';
import { formatSuccess, formatError } from '../utils/message-formatter.js';

/**
 * Handle category button callback queries
 * Parse transaction ID and category ID from callback data
 * Update transaction in ActualBudget and show confirmation
 */
export async function handleCategoryCallback(
  ctx: Context,
  actualApi: ActualApiService
): Promise<void> {
  // Check if this is a category callback
  const callbackData = ctx.callbackQuery?.data;
  if (!callbackData?.startsWith('cat_')) {
    return; // Not a category button, ignore
  }

  try {
    // Parse callback data: cat_{categoryId}_{transactionId}
    // Note: We need to handle UUIDs which contain hyphens but not underscores
    // Format: cat_[categoryId]_[transactionId]
    const parts = callbackData.split('_');

    if (parts.length < 3) {
      throw new Error('Invalid callback data format');
    }

    // Extract IDs - first part after 'cat_' is category, rest is transaction
    const categoryId = parts[1];
    const transactionId = parts.slice(2).join('_');

    if (!categoryId || !transactionId) {
      throw new Error('Missing category or transaction ID');
    }

    // Show loading state (animated clock)
    await ctx.answerCallbackQuery({
      text: '⏳ Categorizing...',
      show_alert: false
    });

    // Get category name for confirmation
    const categories = await actualApi.getCategories();
    const category = categories.find(c => c.id === categoryId);

    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    // Update transaction with new category
    const transaction = await actualApi.updateTransaction(
      transactionId,
      categoryId
    );

    // Get payee name
    const payeeName = transaction.payee_name || transaction.payee || 'Unknown';

    // Format success message
    const successMessage = formatSuccess(payeeName, category.name);

    // Delete the original message with buttons
    try {
      await ctx.deleteMessage();
    } catch (deleteError) {
      // Message might already be deleted, ignore
      console.log('Could not delete message (may already be gone)');
    }

    // Send confirmation message
    await ctx.reply(successMessage, {
      parse_mode: 'HTML'
    });

    console.log(
      `✓ Transaction ${transactionId} categorized as ${category.name}`
    );
  } catch (error) {
    console.error('Error handling category callback:', error);

    // Try to answer callback query with error
    try {
      const errorMessage = formatError(error instanceof Error ? error : 'Unknown error');
      await ctx.answerCallbackQuery({
        text: '❌ Error',
        show_alert: true
      });

      // Send error message
      await ctx.reply(errorMessage, {
        parse_mode: 'HTML'
      });
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}
