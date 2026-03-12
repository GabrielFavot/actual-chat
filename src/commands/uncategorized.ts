import { Context } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';

/**
 * Handle /uncategorized command
 * Display count of uncategorized transactions
 */
export async function handleUncategorizedCommand(
  ctx: Context,
  actualApi: ActualApiService
): Promise<void> {
  try {
    const transactions = await actualApi.getUncategorizedTransactions();
    await ctx.reply(`Found ${transactions.length} uncategorized transactions`);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    await ctx.reply('Error fetching transactions. Check logs.');
  }
}
