import { InlineKeyboard } from 'grammy';
import { Transaction, Category, BudgetMonth } from '../services/actual-api.js';

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
 * Format poll summary message showing count of new transactions
 * @param newCount - Number of new unnotified transactions found
 * @returns Formatted summary message string
 */
export function formatPollSummary(newCount: number): string {
  const label = newCount === 1 ? 'new transaction' : 'new transactions';
  return `🔔 <b>${newCount} ${label}</b> to categorize`;
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

Select a category group:`;
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
 * Step 1 of 2-step categorization: build a keyboard with one button per category group.
 * Tapping a group triggers a grp_ callback which edits the message to show that group's categories.
 *
 * @param categories - All available categories
 * @param categoryGroups - Map of group_id to group name
 * @param sessionId - Session ID used as prefix in callback_data
 * @returns InlineKeyboard with one button per group (one per row)
 */
export function buildGroupKeyboard(
  categories: Category[],
  categoryGroups: Map<string, string>,
  sessionId: string
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Collect unique group IDs that have at least one category
  const groupIds = new Set<string>();
  let hasUngrouped = false;

  for (const category of categories) {
    if (category.group_id) {
      groupIds.add(category.group_id);
    } else {
      hasUngrouped = true;
    }
  }

  for (const groupId of groupIds) {
    const groupName = categoryGroups.get(groupId) || groupId;
    keyboard.text(`📁 ${groupName}`, `grp_${sessionId}_${groupId}`);
    keyboard.row();
  }

  if (hasUngrouped) {
    keyboard.text('📁 Other', `grp_${sessionId}_ungrouped`);
    keyboard.row();
  }

  return keyboard;
}

/**
 * Step 2 of 2-step categorization: build a keyboard with the categories of a single group.
 * Includes a ← Back button to return to the group list.
 *
 * @param categories - All available categories (will be filtered by groupId)
 * @param groupId - The group to display ('ungrouped' for categories without a group)
 * @param groupName - Display name of the group
 * @param sessionId - Session ID used as prefix in callback_data
 * @returns InlineKeyboard with category buttons (2 per row) + Back button
 */
export function buildGroupCategoryKeyboard(
  categories: Category[],
  groupId: string,
  groupName: string,
  sessionId: string
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  const groupCategories =
    groupId === 'ungrouped'
      ? categories.filter((c) => !c.group_id)
      : categories.filter((c) => c.group_id === groupId);

  for (let i = 0; i < groupCategories.length; i += 2) {
    const cat1 = groupCategories[i];
    const cat2 = groupCategories[i + 1];

    keyboard.text(cat1.name, `cat_${sessionId}_${cat1.id}`);
    if (cat2) {
      keyboard.text(cat2.name, `cat_${sessionId}_${cat2.id}`);
    }
    keyboard.row();
  }

  // Back button to return to group list
  keyboard.text('← Back', `back_${sessionId}`);

  return keyboard;
}

/**
 * @deprecated Use buildGroupKeyboard() for 2-step flow instead.
 * Build an InlineKeyboard with all categories grouped by category group (flat, single message).
 * Kept for reference — replaced by 2-step flow to handle large category sets.
 */
export function buildCategoryKeyboard(
  categories: Category[],
  categoryGroups: Map<string, string>,
  sessionId: string
): InlineKeyboard {
  return buildGroupKeyboard(categories, categoryGroups, sessionId);
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

/**
 * Format budget report for display in Telegram
 * Shows per-group summary with per-category breakdown.
 * Each group shows aggregated totals; categories are listed underneath.
 * Filters out: income groups, hidden groups/categories, zero-activity categories.
 *
 * @param budget - BudgetMonth data from getBudgetMonth()
 * @param month - Display month string (e.g. "2026-03")
 * @returns HTML-formatted message for Telegram (parse_mode: 'HTML')
 */
export function formatBudgetReport(budget: BudgetMonth, month: string, detailed = false): string {
  const expenseGroups = budget.categoryGroups.filter(
    (g) => !g.is_income && !g.hidden
  );

  let result = `📊 <b>Budget Report — ${month}</b>\n\n`;

  for (const group of expenseGroups) {
    const activeCategories = group.categories.filter(
      (c) => !c.hidden && (c.budgeted !== 0 || c.spent !== 0)
    );
    if (activeCategories.length === 0) continue;

    const groupSpent = Math.abs(group.spent) / 100;
    const groupBudgeted = group.budgeted / 100;
    const groupBalance = group.balance / 100;
    const groupEmoji = groupBalance < 0 ? '🔴' : groupBalance === 0 ? '⚪' : '🟢';

    const balanceLabel = groupBalance < 0
      ? `${Math.abs(groupBalance).toFixed(2)} over`
      : `${groupBalance.toFixed(2)} left`;

    if (detailed) {
      result += `${groupEmoji} <b>${group.name}</b>: ${balanceLabel} (${groupSpent.toFixed(2)} / ${groupBudgeted.toFixed(2)})\n`;
      for (const cat of activeCategories) {
        const catSpent = Math.abs(cat.spent) / 100;
        const catBudgeted = cat.budgeted / 100;
        const catBalance = cat.balance / 100;
        const catEmoji = catBalance < 0 ? '🔴' : catBalance === 0 ? '⚪' : '🟢';
        const catLabel = catBalance < 0
          ? `${Math.abs(catBalance).toFixed(2)} over`
          : `${catBalance.toFixed(2)} left`;
        result += `  ${catEmoji} ${cat.name}: ${catLabel} (${catSpent.toFixed(2)} / ${catBudgeted.toFixed(2)})\n`;
      }
    } else {
      result += `${groupEmoji} <b>${group.name}</b>: ${balanceLabel}\n`;
    }
  }

  const totalIncome = budget.categoryGroups
    .filter((g) => g.is_income)
    .flatMap((g) => g.categories)
    .reduce((sum, c) => sum + (c.spent ?? 0), 0) / 100;
  const totalExpenses = expenseGroups
    .flatMap((g) => g.categories)
    .reduce((sum, c) => sum + (c.spent ?? 0), 0) / 100; // negative
  const net = totalIncome + totalExpenses;
  const netLabel = net >= 0 ? `+${net.toFixed(2)}` : net.toFixed(2);
  const netEmoji = net >= 0 ? '📈' : '📉';
  result += `\n${netEmoji} <b>Net: ${netLabel}</b>`;

  return result;
}
