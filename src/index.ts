import { Bot } from 'grammy';
import 'dotenv/config';
import { authMiddleware } from './middleware/auth.js';
import { ActualApiService } from './services/actual-api.js';

// Validate required environment variables at startup
const REQUIRED_ENV = [
  'TELEGRAM_BOT_TOKEN',
  'ACTUAL_SERVER_URL',
  'ACTUAL_SERVER_PASSWORD',
  'BUDGET_ID',
  'AUTHORIZED_USER_IDS'
];

for (const env of REQUIRED_ENV) {
  if (!process.env[env]) {
    throw new Error(`${env} environment variable is required`);
  }
}

// Initialize the Telegram bot
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// Apply authorization middleware
bot.use(authMiddleware);

// Initialize ActualBudget API service
const actualApi = new ActualApiService({
  serverUrl: process.env.ACTUAL_SERVER_URL!,
  password: process.env.ACTUAL_SERVER_PASSWORD!,
  budgetId: process.env.BUDGET_ID!,
  e2ePassword: process.env.ACTUAL_E2E_PASSWORD,
});

// Error handling for the bot
bot.catch((err) => {
  console.error('Bot error:', err);
});

console.log('Initializing ActualBudget API...');

// Initialize API and start bot
(async () => {
  try {
    await actualApi.initialize();
    console.log('ActualBudget API initialized successfully');
    
    console.log('Bot starting...');
    
    // /start command
    bot.command('start', async (ctx) => {
      const userId = ctx.from?.id;
      if (userId) {
        await ctx.reply(`Welcome! Your Telegram ID is: ${userId}`);
      }
    });

    // /uncategorized command - test fetching uncategorized transactions
    bot.command('uncategorized', async (ctx) => {
      try {
        const transactions = await actualApi.getUncategorizedTransactions();
        await ctx.reply(`Found ${transactions.length} uncategorized transactions`);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        await ctx.reply('Error fetching transactions. Check logs.');
      }
    });

    // /categories command - test fetching categories
    bot.command('categories', async (ctx) => {
      try {
        const categories = await actualApi.getCategories();
        await ctx.reply(`Found ${categories.length} categories`);
      } catch (error) {
        console.error('Error fetching categories:', error);
        await ctx.reply('Error fetching categories. Check logs.');
      }
    });

    // Start the bot
    await bot.start();
  } catch (error) {
    console.error('Failed to initialize bot:', error);
    process.exit(1);
  }
})();
