import { Context } from 'grammy';

/**
 * Handle /help command
 * Display list of available commands with descriptions
 */
export async function handleHelpCommand(ctx: Context): Promise<void> {
  const helpMessage = `🤖 <b>Available Commands</b>

<b>/start</b>
Get your Telegram ID (needed for setup)

<b>/transaction</b>
View next uncategorized transaction with category buttons
2-tap workflow: see transaction → tap category → categorize

<b>/uncategorized</b>
Check how many uncategorized transactions exist

<b>/categories</b>
Check how many categories are available

<b>/report</b>
View remaining budget per category for the current month

<b>/help</b>
Show this message`;

  await ctx.reply(helpMessage, { parse_mode: 'HTML' });
}
