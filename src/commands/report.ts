import { Context } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';
import { formatBudgetReport } from '../utils/message-formatter.js';

/**
 * Get current month in "YYYY-MM" format.
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Handle /report command.
 * Fetches budget data for the current month and sends a per-category
 * remaining balance report grouped by category group.
 */
export async function handleReportCommand(
  ctx: Context,
  actualApi: ActualApiService
): Promise<void> {
  try {
    const month = getCurrentMonth();
    const detailed = ctx.match?.toString().trim() === 'detail';
    const [budgetData, transactions] = await Promise.all([
      actualApi.getBudgetMonth(month),
      actualApi.getMonthTransactions(month),
    ]);
    const net = transactions.reduce((sum, t) => sum + t.amount, 0) / 100;
    const formatted = formatBudgetReport(budgetData, month, detailed, net);
    await ctx.reply(formatted, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error fetching budget report:', error);
    await ctx.reply('❌ Error fetching budget report. Check logs.');
  }
}
