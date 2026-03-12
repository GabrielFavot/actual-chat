import { Context } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';
import { sessionManager } from '../utils/session-manager.js';
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
    // Parse callback data: cat_{sessionId}_{categoryId}
    // Example: cat_txn_1_550e8400-e29b-41d4-a716-446655440000
    const parts = callbackData.split('_');

    if (parts.length < 4) {
      throw new Error('Invalid callback data format');
    }

    // Extract: sessionId (part[1]), categoryId (rest)
    const sessionId = `${parts[1]}_${parts[2]}`;
    const categoryId = parts.slice(3).join('_'); // Handle UUIDs with hyphens

    // Retrieve transaction from session
    const transaction = sessionManager.getTransaction(sessionId);
    if (!transaction) {
      throw new Error('Transaction session expired or not found. Please use /transaction again.');
    }

    const transactionId = transaction.id;

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
    const updatedTransaction = await actualApi.updateTransaction(
      transactionId,
      categoryId
    );

    // Get budget currency
    const currency = await actualApi.getBudgetCurrency();

    // Get payee name from cache (payee field contains payee ID)
    const payeeMap = await actualApi.getPayeesMap();
    const payeeName = updatedTransaction.payee 
      ? (payeeMap.get(updatedTransaction.payee) || updatedTransaction.payee_name || 'Transaction')
      : (updatedTransaction.payee_name || 'Transaction');

    // Format success message
    const successMessage = formatSuccess(
      payeeName,
      category.name,
      updatedTransaction.amount,
      currency
    );

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

    // Clear the session after successful categorization
    sessionManager.clearSession(sessionId);

    console.log(
      `✓ Transaction ${transactionId} categorized as ${category.name}`
    );
  } catch (error) {
    console.error('Error handling category callback:', error);

    // Try to answer callback query with error
    try {
      await ctx.answerCallbackQuery({
        text: '❌ Error',
        show_alert: true
      });

      const errorMessage = formatError(error instanceof Error ? error : 'Unknown error');

      // Send error message
      await ctx.reply(errorMessage, {
        parse_mode: 'HTML'
      });
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}
