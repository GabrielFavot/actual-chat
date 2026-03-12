import { Transaction } from '../services/actual-api.js';

/**
 * Currency symbol mapping
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CHF': 'CHF',
  'CAD': 'C$',
  'AUD': 'A$',
  'NZD': 'NZ$',
  'INR': '₹',
  'CNY': '¥',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
};

/**
 * Format amount as currency
 * @param amount - Amount in cents (from API)
 * @param currency - Currency code (USD, EUR, etc.)
 * @returns Formatted currency string (e.g., "-€5,50" or "-$5.50")
 */
export function formatAmount(amount: number, currency: string = 'USD'): string {
  const absAmount = Math.abs(amount) / 100;
  const sign = amount < 0 ? '-' : '+';
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  
  // Use comma for decimal in EUR, dot for others
  const decimalSeparator = currency === 'EUR' ? ',' : '.';
  const formattedAmount = absAmount.toFixed(2).replace('.', decimalSeparator);
  
  return `${sign}${symbol}${formattedAmount}`;
}

/**
 * Format transaction for display in Telegram
 * @param transaction - Transaction object from API
 * @param currency - Currency code (USD, EUR, etc.)
 * @param accountName - Optional account name (if available)
 * @returns Formatted message string
 */
export function formatTransaction(
  transaction: Transaction,
  currency: string = 'USD',
  accountName?: string
): string {
  const payee = transaction.payee_name || transaction.payee || 'Unknown';
  const amount = formatAmount(transaction.amount, currency);
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
 * @param amount - Optional amount (in cents)
 * @param currency - Optional currency code
 * @returns Success message
 */
export function formatSuccess(
  payee: string,
  categoryName: string,
  amount?: number,
  currency: string = 'USD'
): string {
  const amountStr = amount ? ` • ${formatAmount(amount, currency)}` : '';
  return `✅ <b>Categorized!</b>

Transaction from <b>${payee}</b> → <b>${categoryName}</b>${amountStr}`;
}
