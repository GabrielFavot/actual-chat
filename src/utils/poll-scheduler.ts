import { Bot, GrammyError } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';
import { sessionManager } from './session-manager.js';
import { formatTransaction, formatPollSummary, buildGroupKeyboard } from './message-formatter.js';

/**
 * PollScheduler: Automated polling for uncategorized transactions
 * 
 * - Runs startup check immediately on initialization
 * - Polls every 4 hours for new uncategorized transactions
 * - Prevents concurrent polls via mutex
 * - Sends notifications only for new transactions
 * - Handles errors gracefully
 */

// Polling state
let isPolling = false;
let pollInterval: NodeJS.Timeout | null = null;

// Poll interval: 4 hours = 14,400,000 milliseconds
const POLL_INTERVAL_MS = 4 * 60 * 60 * 1000;

/**
 * Start the polling scheduler
 * Immediately runs one poll, then schedules 4-hour interval polls
 */
export async function startPolling(
  bot: Bot,
  actualApi: ActualApiService,
  authorizedUserId: number,
): Promise<void> {
  console.log(`Starting polling scheduler (4-hour interval, target user: ${authorizedUserId})`);

  // Run initial poll immediately
  await performPoll(bot, actualApi, authorizedUserId);

  // Schedule recurring polls every 4 hours
  pollInterval = setInterval(async () => {
    await performPoll(bot, actualApi, authorizedUserId);
  }, POLL_INTERVAL_MS);

  console.log('✓ Polling scheduler started');
}

/**
 * Perform a single poll cycle
 * - Syncs bank accounts first (with error tolerance)
 * - Prevents concurrent polls via mutex
 * - Fetches uncategorized transactions
 * - Sends notification if new transaction found
 * - Handles errors gracefully
 */
async function performPoll(
  bot: Bot,
  actualApi: ActualApiService,
  authorizedUserId: number,
): Promise<void> {
  // Mutex: prevent concurrent polls
  if (isPolling) {
    console.log('⊘ Poll skipped (another poll in progress)');
    return;
  }

  isPolling = true;

  try {
    console.log(`[${new Date().toISOString()}] Starting poll cycle...`);

    // Sync local budget from server first (picks up categorizations done in Actual UI)
    try {
      await actualApi.syncFromServer();
    } catch (error) {
      console.warn(
        '⚠️ Budget sync from server failed, continuing with local data:',
        error instanceof Error ? error.message : String(error)
      );
    }

    // Sync bank accounts to pull new transactions from banks
    try {
      await actualApi.syncBankAccounts();
    } catch (error) {
      console.warn(
        '⚠️ Bank sync failed, continuing with existing transactions:',
        error instanceof Error ? error.message : String(error)
      );
      // Continue with poll even if sync fails - we can still use cached transactions
    }

    // Fetch uncategorized transactions
    const transactions = await actualApi.getUncategorizedTransactions();

    if (transactions.length === 0) {
      console.log('Poll complete: no uncategorized transactions');
      return;
    }

    // Sort by date (descending) to get the newest transaction
    const sortedTransactions = transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Newest first
    });

    const newestTransaction = sortedTransactions[0];

    // Send summary message before the individual transaction prompt
    const summaryMessage = formatPollSummary(sortedTransactions.length);
    await bot.api.sendMessage(authorizedUserId, summaryMessage, { parse_mode: 'HTML' });

    // Fetch account name for the transaction
    let accountName: string | undefined;
    try {
      const account = await actualApi.getAccount(newestTransaction.account_id);
      accountName = account.name;
    } catch (error) {
      console.warn(
        `Could not fetch account name for ${newestTransaction.account_id}:`,
        error
      );
    }

    // Format transaction message
    const message = formatTransaction(newestTransaction, accountName);

    // Fetch categories for inline buttons
    const categories = await actualApi.getCategories();
    const categoryGroups = await actualApi.getCategoryGroups();

    if (categories.length === 0) {
      // Send message without buttons if no categories
      await bot.api.sendMessage(authorizedUserId, message, {
        parse_mode: 'HTML'
      });
      console.log(`Poll complete: sent notification (no categories available)`);
      return;
    }

    // Store transaction in session for callback handling
    const sessionId = sessionManager.storeTransaction(newestTransaction);

    // Build group-selection keyboard (step 1 of 2-step flow)
    const keyboard = buildGroupKeyboard(categories, categoryGroups, sessionId);

    // Send notification with keyboard
    await bot.api.sendMessage(authorizedUserId, message, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });

    console.log(
      `Poll complete: sent notification for ${newestTransaction.payee_name} ${newestTransaction.amount}`
    );
  } catch (error) {
    if (error instanceof GrammyError && error.error_code === 429) {
      const retryAfter = error.parameters.retry_after ?? 'unknown';
      console.warn(`⚠️ Telegram rate limit hit during poll — retry after ${retryAfter}s. Skipping this cycle.`);
    } else {
      console.error('Error during poll cycle:', error);
    }
    // Don't crash — continue polling even if this cycle failed
  } finally {
    isPolling = false;
  }
}

/**
 * Stop the polling scheduler
 * Called during bot shutdown
 */
export function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log('Polling scheduler stopped');
  }
}
