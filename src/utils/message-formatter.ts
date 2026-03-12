import { Transaction, Category } from '../services/actual-api.js';

/**
 * Format amount as a number
 * @param amount - Amount in cents (from API)
 * @returns Formatted amount string (e.g., "-5.50")
 */
export function formatAmount(amount: number): string {
  const absAmount = Math.abs(amount) / 100;
  const sign = amount < 0 ? '-' : '+';
  return `${sign}${absAmount.toFixed(2)}`;
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
 * @param amount - Optional amount (in cents)
 * @returns Success message
 */
export function formatSuccess(
  payee: string,
  categoryName: string,
  amount?: number
): string {
  const amountStr = amount ? ` • ${formatAmount(amount)}` : '';
  return `✅ <b>Categorized!</b>

Transaction from <b>${payee}</b> → <b>${categoryName}</b>${amountStr}`;
}

/**
 * Format category list with hierarchy (main + subcategories)
 * @param categories - Array of categories from API
 * @returns Formatted category list with hierarchy
 */
export function formatCategoryList(categories: Category[]): string {
  // Separate main categories (no group_id) from subcategories
  const mainCategories = categories.filter(c => !c.group_id);
  const subCategories = categories.filter(c => c.group_id);

  // If there are no main categories, just show a flat list
  // (this happens when all categories have group_id but parents aren't included)
  if (mainCategories.length === 0) {
    let result = `📁 <b>Categories</b> (${categories.length} total)\n\n`;
    
    // Sort alphabetically for readability
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    
    sorted.forEach((cat, index) => {
      result += `${index + 1}. ${cat.name}\n`;
    });

    return result;
  }

  // Build a map of group_id to subcategories
  const subCategoryMap = new Map<string, Category[]>();
  subCategories.forEach(sub => {
    const key = sub.group_id || '';
    if (!subCategoryMap.has(key)) {
      subCategoryMap.set(key, []);
    }
    subCategoryMap.get(key)!.push(sub);
  });

  // Build the display string with hierarchy
  let result = `📁 <b>Categories</b> (${categories.length} total)\n\n`;

  mainCategories.forEach((main, index) => {
    // Add main category
    result += `<b>${main.name}</b>\n`;

    // Add subcategories if they exist
    const subs = subCategoryMap.get(main.id) || [];
    subs.forEach((sub, subIndex) => {
      const isLast = subIndex === subs.length - 1;
      const prefix = isLast ? '  └─ ' : '  ├─ ';
      result += `${prefix}${sub.name}\n`;
    });

    // Add spacing between main categories
    if (index < mainCategories.length - 1) {
      result += '\n';
    }
  });

  // Add note if there are subcategories without a visible parent
  const orphanedSubs = subCategories.filter(
    sub => !mainCategories.find(m => m.id === sub.group_id)
  );
  if (orphanedSubs.length > 0) {
    result += `\n<i>Note: ${orphanedSubs.length} subcategories without visible parent</i>`;
  }

  return result;
}
