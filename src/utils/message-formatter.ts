import { Transaction } from '../services/actual-api.js';

/**
 * Format amount as currency
 * @param amount - Amount in cents (from API)
 * @returns Formatted currency string (e.g., "-$5.50")
 */
export function formatAmount(amount: number): string {
  const absAmount = Math.abs(amount) / 100;
  const sign = amount < 0 ? '-' : '+';
  return `${sign}$${absAmount.toFixed(2)}`;
}

/**
 * Format transaction for display in Telegram
 * @param transaction - Transaction object from API
 * @param accountName - Optional account name (if available)
 * @returns Formatted message string
 */
export function formatTransaction(
  transaction: Transaction,
  accountName?: string
): string {
  const payee = transaction.payee_name || transaction.payee || 'Unknown';
  const amount = formatAmount(transaction.amount);
  const account = accountName || 'Unknown Account';

  return `📝 <b>Categorize Transaction</b>

<b>Date:</b> ${transaction.date}
<b>Payee:</b> ${payee}
<b>Amount:</b> ${amount}
<b>Account:</b> ${account}

Select a category from the buttons below:`;
}

/**
 * Format error message for user
 * @param error - Error object or message
 * @returns User-friendly error message
 */
export function formatError(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;

  if (message.includes('Transaction not found')) {
    return '❌ Transaction no longer exists. Please try again.';
  }

  if (message.includes('Category not found')) {
    return '❌ Category not found. Please try again.';
  }

  if (message.includes('API not initialized')) {
    return '❌ Bot not ready. Please try again in a moment.';
  }

  // Default error message
  return '❌ An error occurred. Please try again or contact support.';
}

/**
 * Format success message after categorization
 * @param payee - Payee name
 * @param categoryName - Category name selected
 * @returns Success message
 */
export function formatSuccess(payee: string, categoryName: string): string {
  return `✅ <b>Categorized!</b>

Transaction from <b>${payee}</b> → <b>${categoryName}</b>`;
}
