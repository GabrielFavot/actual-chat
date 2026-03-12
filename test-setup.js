#!/usr/bin/env node

/**
 * Setup validation script
 * Tests all configuration and ActualBudget connectivity
 */

import 'dotenv/config';

// Polyfill navigator for Node.js
if (typeof navigator === 'undefined') {
  globalThis.navigator = {
    platform: process.platform === 'win32' ? 'Win32' : 'Linux',
  };
}

import { ConfigValidator } from './dist/utils/config-validator.js';
import { ActualApiService } from './dist/services/actual-api.js';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  ActualBudget Telegram Bot - Setup Verification           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Step 1: Validate configuration
console.log('Step 1: Checking Configuration...\n');

const validator = new ConfigValidator();
const errors = validator.validateAll();

if (errors.length > 0) {
  console.error(ConfigValidator.formatErrors(errors));
  process.exit(1);
}

console.log('✓ All configuration variables present and valid\n');

// Step 2: Test Telegram configuration (basic check)
console.log('Step 2: Checking Telegram Configuration...\n');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const authorizedIds = process.env.AUTHORIZED_USER_IDS;

console.log(`  Bot Token: ${botToken?.substring(0, 10)}...${botToken?.substring(botToken.length - 5)}`);
console.log(`  Authorized User IDs: ${authorizedIds}\n`);
console.log('✓ Telegram configuration loaded\n');

// Step 3: Test ActualBudget connectivity
console.log('Step 3: Testing ActualBudget Connection...\n');

const actualApi = new ActualApiService({
  serverUrl: process.env.ACTUAL_SERVER_URL,
  password: process.env.ACTUAL_SERVER_PASSWORD,
  budgetId: process.env.BUDGET_ID,
  e2ePassword: process.env.ACTUAL_E2E_PASSWORD,
});

(async () => {
  try {
    console.log(`  Connecting to: ${process.env.ACTUAL_SERVER_URL}`);
    console.log(`  Budget ID: ${process.env.BUDGET_ID}\n`);

    await actualApi.initialize();
    console.log('✓ Successfully connected to ActualBudget\n');

    // Step 4: Fetch sample data
    console.log('Step 4: Fetching Sample Data...\n');

    const transactions = await actualApi.getUncategorizedTransactions();
    console.log(`  Uncategorized Transactions: ${transactions.length}`);
    if (transactions.length > 0) {
      const t = transactions[0];
      console.log(`    Sample: ${t.date} | ${t.payee_name || 'Unknown'} | ${t.amount}`);
    }

    const categories = await actualApi.getCategories();
    console.log(`  Available Categories: ${categories.length}`);
    if (categories.length > 0) {
      console.log(`    Sample: ${categories.slice(0, 3).map(c => c.name).join(', ')}`);
    }

    console.log('\n✓ Data fetch successful\n');

    // Final summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✓ ALL SYSTEMS GO!                                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('You can now run: npm start\n');

    await actualApi.shutdown();
  } catch (error) {
    console.error('\n❌ ActualBudget Connection Failed\n');

    if (error instanceof Error) {
      console.error(`Error: ${error.message}\n`);

      // Provide helpful hints based on error type
      if (error.message.includes('ECONNREFUSED')) {
        console.error('Hint: Cannot reach ActualBudget server');
        console.error(`  - Check ACTUAL_SERVER_URL: ${process.env.ACTUAL_SERVER_URL}`);
        console.error('  - Ensure ActualBudget is running on that URL\n');
      } else if (error.message.includes('Authentication failed')) {
        console.error('Hint: Authentication failed with provided credentials');
        console.error(`  - Check ACTUAL_SERVER_PASSWORD is correct`);
        console.error(`  - Check BUDGET_ID is correct (from ActualBudget Settings)`);
        console.error(`  - Check ACTUAL_E2E_PASSWORD if budget uses encryption\n`);
      } else if (error.message.includes('parse-json')) {
        console.error('Hint: Invalid credentials or budget not found');
        console.error(`  - Verify BUDGET_ID exists in ActualBudget`);
        console.error(`  - Verify ACTUAL_SERVER_PASSWORD is correct\n`);
      }
    }

    console.error('Next Steps:');
    console.error('1. Fix the configuration in .env');
    console.error('2. Run: node test-setup.js\n');

    process.exit(1);
  }
})();
