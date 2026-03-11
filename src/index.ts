import { Bot } from 'grammy';
import 'dotenv/config';
import { authMiddleware } from './middleware/auth.js';

// Get the Telegram bot token from environment
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
}

// Initialize the bot with the Telegram token
const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Apply authorization middleware - must be added before other handlers
bot.use(authMiddleware);

// Error handling for the bot
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Basic startup message
console.log('Bot starting...');

// /start command - shows user's Telegram ID for configuration
bot.command('start', async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    await ctx.reply(`Welcome! Your Telegram ID is: ${userId}`);
  }
});

// Start the bot
bot.start();
