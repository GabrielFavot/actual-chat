// Polyfill navigator for Node.js environment (required by @actual-app/api)
if (typeof navigator === 'undefined') {
  (globalThis as any).navigator = {
    platform: process.platform === 'win32' ? 'Win32' : 'Linux',
  };
}

import 'dotenv/config';
import { Bot } from 'grammy';
import { ConfigValidator } from './utils/config-validator.js';
import { authMiddleware, authorizedUserId } from './middleware/auth.js';
import { ActualApiService } from './services/actual-api.js';
import { NotifierState } from './services/notifier-state.js';
import { handleTransactionCommand } from './commands/transaction.js';
import { handleUncategorizedCommand } from './commands/uncategorized.js';
import { handleCategoriesCommand } from './commands/categories.js';
import { handleHelpCommand } from './commands/help.js';
import { handleCategoryCallback } from './handlers/category-callback.js';
import { startPolling } from './utils/poll-scheduler.js';

// Validate configuration with helpful error messages
ConfigValidator.validateAndExit();

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
    console.log('Connecting to ActualBudget...');
    await actualApi.initialize();
    console.log('✓ ActualBudget API initialized successfully\n');
    
    // Initialize notification state (loads persisted state from file)
    const notifierState = new NotifierState();
    await notifierState.initialize();
    console.log('✓ Notification state initialized\n');
    
    console.log('Setting up bot commands...');
    
    // /start command
    bot.command('start', async (ctx) => {
      const userId = ctx.from?.id;
      if (userId) {
        await ctx.reply(`Welcome! Your Telegram ID is: ${userId}`);
      }
    });

    // /uncategorized command - count uncategorized transactions
    bot.command('uncategorized', (ctx) => handleUncategorizedCommand(ctx, actualApi));

    // /categories command - display all categories grouped by category group
    bot.command('categories', (ctx) => handleCategoriesCommand(ctx, actualApi));

    // /transaction command - display first uncategorized transaction with category buttons
    bot.command('transaction', (ctx) => handleTransactionCommand(ctx, actualApi));

    // /help command - show available commands
    bot.command('help', (ctx) => handleHelpCommand(ctx));

    // Category button callback handler
    bot.on('callback_query:data', (ctx) => handleCategoryCallback(ctx, actualApi));

    console.log('✓ Bot commands registered\n');
    
    // Start polling scheduler (runs startup check + 4-hour interval)
    console.log('Starting polling scheduler...');
    startPolling(bot, actualApi, authorizedUserId, notifierState);
    
    console.log('🤖 Bot starting... waiting for messages\n');
    
    // Start the bot
    await bot.start();
  } catch (error) {
    console.error('\n❌ Failed to initialize bot\n');
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}\n`);

      // Helpful hints for common errors
      if (error.message.includes('ECONNREFUSED')) {
        console.error('Issue: Cannot connect to ActualBudget server');
        console.error(`  - Check ACTUAL_SERVER_URL in .env: ${process.env.ACTUAL_SERVER_URL}`);
        console.error('  - Ensure ActualBudget is running and accessible\n');
      } else if (error.message.includes('Authentication failed') || error.message.includes('parse-json')) {
        console.error('Issue: Invalid ActualBudget credentials');
        console.error('  - Verify ACTUAL_SERVER_PASSWORD is correct');
        console.error('  - Verify BUDGET_ID exists in ActualBudget');
        console.error('  - Verify ACTUAL_E2E_PASSWORD if using encryption\n');
        console.error('How to find BUDGET_ID:');
        console.error('  1. Open ActualBudget');
        console.error('  2. Go to Settings');
        console.error('  3. Enable "Show advanced settings"');
        console.error('  4. Copy the "Sync ID" value\n');
      }
    }

    console.error('Next steps:');
    console.error('1. Update .env with correct credentials');
    console.error('2. Run: npm run test:setup');
    console.error('3. Then: npm start\n');

    process.exit(1);
  }
})();
