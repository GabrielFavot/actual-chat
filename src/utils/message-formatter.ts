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
 * Format category list with hierarchy (grouped by category group)
 * @param categories - Array of categories from API
 * @param groups - Map of group_id to group name (from getCategoryGroups)
 * @returns Formatted category list with hierarchy
 */
export function formatCategoryList(categories: Category[], groups?: Map<string, string>): string {
  // Build a map of group_id to categories
  const categoryMap = new Map<string, Category[]>();
  categories.forEach(cat => {
    const key = cat.group_id || '';
    if (!categoryMap.has(key)) {
      categoryMap.set(key, []);
    }
    categoryMap.get(key)!.push(cat);
  });

  // Get all group IDs and sort them by the group name if available
  const groupIds = Array.from(categoryMap.keys()).sort((a, b) => {
    const nameA = groups?.get(a) || '';
    const nameB = groups?.get(b) || '';
    return nameA.localeCompare(nameB);
  });
  
  // Build the display string with hierarchy
  let result = `📁 <b>Categories</b> (${categories.length} total)\n\n`;

  groupIds.forEach((groupId, groupIndex) => {
    const groupCats = categoryMap.get(groupId) || [];
    const groupName = groups?.get(groupId) || `Group ${groupIndex + 1}`;

    result += `<b>${groupName}</b>\n`;

    // Sort categories within group alphabetically
    const sortedCats = [...groupCats].sort((a, b) => a.name.localeCompare(b.name));
    sortedCats.forEach((cat, catIndex) => {
      const isLast = catIndex === sortedCats.length - 1;
      const prefix = isLast ? '  └─ ' : '  ├─ ';
      result += `${prefix}${cat.name}\n`;
    });

    // Add spacing between groups
    if (groupIndex < groupIds.length - 1) {
      result += '\n';
    }
  });

  return result;
}
