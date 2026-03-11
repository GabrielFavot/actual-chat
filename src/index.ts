import { Bot } from 'grammy';
import 'dotenv/config';

// Get the Telegram bot token from environment
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
}

// Initialize the bot with the Telegram token
const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Error handling for the bot
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Basic startup message
console.log('Bot starting...');

// Echo handler - replies with the same message received
bot.on('message:text', (ctx) => {
  ctx.reply(ctx.message.text);
});

// Start the bot
bot.start();
