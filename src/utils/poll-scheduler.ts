import { Bot, Context } from 'grammy';
import { ActualApiService } from '../services/actual-api.js';
import { NotifierState } from '../services/notifier-state.js';
import { formatTransaction } from './message-formatter.js';
import { InlineKeyboard } from 'grammy';

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
 * 
 * @param bot - grammY Bot instance for sending messages
 * @param actualApi - ActualApiService for fetching transactions
 * @param authorizedUserId - Telegram user ID to send notifications to
 * @param notifierState - NotifierState for tracking notified transactions
 */
export async function startPolling(
  bot: Bot,
  actualApi: ActualApiService,
  authorizedUserId: number,
  notifierState: NotifierState
): Promise<void> {
  console.log(`Starting polling scheduler (4-hour interval, target user: ${authorizedUserId})`);

  // Run initial poll immediately
  await performPoll(bot, actualApi, authorizedUserId, notifierState);

  // Schedule recurring polls every 4 hours
  pollInterval = setInterval(async () => {
    await performPoll(bot, actualApi, authorizedUserId, notifierState);
  }, POLL_INTERVAL_MS);

  console.log('✓ Polling scheduler started');
}

/**
 * Perform a single poll cycle
 * - Prevents concurrent polls via mutex
 * - Fetches uncategorized transactions
 * - Sends notification if new transaction found
 * - Handles errors gracefully
 */
async function performPoll(
  bot: Bot,
  actualApi: ActualApiService,
  authorizedUserId: number,
  notifierState: NotifierState
): Promise<void> {
  // Mutex: prevent concurrent polls
  if (isPolling) {
    console.log('⊘ Poll skipped (another poll in progress)');
    return;
  }

  isPolling = true;

  try {
    console.log(`[${new Date().toISOString()}] Starting poll cycle...`);

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

    // Check if we've already notified about this transaction
    if (notifierState.hasBeenNotified(newestTransaction.id)) {
      console.log(`Poll complete: newest transaction already notified (${newestTransaction.id})`);
      return;
    }

    // Mark as notified
    notifierState.markNotified(newestTransaction.id);

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

    // Build inline keyboard with grouped categories
    const keyboard = new InlineKeyboard();

    // Organize categories by group
    const categoriesByGroup = new Map<string, typeof categories>();
    const ungroupedCategories: typeof categories = [];

    for (const category of categories) {
      if (category.group_id) {
        if (!categoriesByGroup.has(category.group_id)) {
          categoriesByGroup.set(category.group_id, []);
        }
        categoriesByGroup.get(category.group_id)!.push(category);
      } else {
        ungroupedCategories.push(category);
      }
    }

    // Process each group and add to keyboard
    for (const [groupId, groupCategories] of categoriesByGroup.entries()) {
      const groupName = categoryGroups.get(groupId) || groupId;

      // Add group header as a single button (non-functional)
      keyboard.text(`📁 ${groupName}`, `group_${groupId}`);
      keyboard.row();

      // Add category buttons (2 per row)
      for (let i = 0; i < groupCategories.length; i += 2) {
        const cat1 = groupCategories[i];
        const cat2 = groupCategories[i + 1];

        // Store transaction in session for callback handling
        // Since this is polling (not command), we use transaction ID directly in callback
        keyboard.text(
          cat1.name,
          `cat_poll_${newestTransaction.id}_${cat1.id}`
        );

        if (cat2) {
          keyboard.text(
            cat2.name,
            `cat_poll_${newestTransaction.id}_${cat2.id}`
          );
        }

        if (i + 2 < groupCategories.length) {
          keyboard.row();
        }
      }

      keyboard.row();
    }

    // Add ungrouped categories if any
    if (ungroupedCategories.length > 0) {
      keyboard.text('📁 Other', `group_uncategorized`);
      keyboard.row();

      for (let i = 0; i < ungroupedCategories.length; i += 2) {
        const cat1 = ungroupedCategories[i];
        const cat2 = ungroupedCategories[i + 1];

        keyboard.text(
          cat1.name,
          `cat_poll_${newestTransaction.id}_${cat1.id}`
        );

        if (cat2) {
          keyboard.text(
            cat2.name,
            `cat_poll_${newestTransaction.id}_${cat2.id}`
          );
        }

        if (i + 2 < ungroupedCategories.length) {
          keyboard.row();
        }
      }
    }

    // Send notification with keyboard
    await bot.api.sendMessage(authorizedUserId, message, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });

    console.log(
      `Poll complete: sent notification for ${newestTransaction.payee_name} ${newestTransaction.amount}`
    );
  } catch (error) {
    console.error('Error during poll cycle:', error);
    // Don't crash - continue polling even if this cycle failed
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
