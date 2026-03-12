import { Context } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';
import { formatCategoryList } from '../utils/message-formatter.js';

/**
 * Handle /categories command
 * Display all categories grouped by category group
 */
export async function handleCategoriesCommand(
  ctx: Context,
  actualApi: ActualApiService
): Promise<void> {
  try {
    const categories = await actualApi.getCategories();
    if (categories.length === 0) {
      await ctx.reply('❌ No categories available in your budget.');
      return;
    }

    const groups = await actualApi.getCategoryGroups();
    const formatted = formatCategoryList(categories, groups);
    await ctx.reply(formatted, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error fetching categories:', error);
    await ctx.reply('❌ Error fetching categories. Check logs.');
  }
}
