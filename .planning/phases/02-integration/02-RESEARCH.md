# Phase 2: Integration - Research

**Researched:** 2026-03-11
**Domain:** ActualBudget API integration, transaction fetching
**Confidence:** HIGH

## Summary

Phase 2 involves connecting the Telegram bot to ActualBudget via `@actual-app/api` to fetch uncategorized transactions and categories. The implementation follows the same approach as `actual-ai` - the most popular community project using this API.

**Primary recommendation:** Use `@actual-app/api` library with environment variables `ACTUAL_SERVER_URL`, `ACTUAL_SERVER_PASSWORD`, and `BUDGET_ID`. Initialize with `api.init()` then `api.downloadBudget()`. Filter uncategorized transactions client-side by checking `transaction.category === null`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @actual-app/api | Latest (npm) | Connect to ActualBudget server | Official Node.js client from Actual Budget team |
| dotenv | ^16.5.0 | Environment variable loading | Already in project |

### Installation
```bash
npm install @actual-app/api
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── index.ts                 # Entry point (Phase 1)
├── services/
│   └── actual-api.ts       # ActualBudget API wrapper
├── middleware/
│   └── auth.ts             # Phase 1 - auth middleware
└── utils/
    └── logger.ts           # Logging utility
```

### Pattern 1: API Initialization
**What:** Connect to ActualBudget server and load budget at startup
**When to use:** When bot starts, before any transaction fetching
**Example:**
```typescript
// Source: actual-ai/src/actual-api-service.ts
import actual from '@actual-app/api';

const serverURL = process.env.ACTUAL_SERVER_URL;
const password = process.env.ACTUAL_SERVER_PASSWORD;
const budgetId = process.env.BUDGET_ID;
const dataDir = '/tmp/actual-telegram-notif/';

async function initializeApi() {
  await actual.init({
    dataDir,
    serverURL,
    password,
  });
  
  await actual.downloadBudget(budgetId);
  console.log('Budget downloaded successfully');
}
```

### Pattern 2: Fetching Uncategorized Transactions
**What:** Get all transactions and filter for uncategorized ones
**When to use:** When polling for new transactions to notify user
**Example:**
```typescript
// Source: actual-ai/src/actual-api-service.ts + transaction-filterer.ts
import actual from '@actual-app/api';

async function getUncategorizedTransactions() {
  const accounts = await actual.getAccounts();
  let allTransactions = [];
  
  // Get transactions from all accounts
  for (const account of accounts) {
    const transactions = await actual.getTransactions(
      account.id, 
      '1990-01-01', 
      '2030-01-01'
    );
    allTransactions = allTransactions.concat(transactions);
  }
  
  // Filter for uncategorized (category is null/undefined)
  return allTransactions.filter(t => !t.category);
}
```

### Pattern 3: Fetching Categories
**What:** Get all category groups and categories for UI display
**When to use:** When building category selection keyboard
**Example:**
```typescript
// Source: actualbudget.org/docs/api/reference
import actual from '@actual-app/api';

async function getCategories() {
  // Get flat category list
  const categories = await actual.getCategories();
  
  // Or get grouped categories
  const categoryGroups = await actual.getCategoryGroups();
  
  return { categories, categoryGroups };
}
```

### Pattern 4: Fail-Fast Credential Validation
**What:** Validate required environment variables at startup, exit with clear error
**When to use:** At bot startup before any other initialization
**Example:**
```typescript
// Source: actual-ai/src/config.ts pattern + project Phase 1 pattern
function validateCredentials() {
  const required = [
    'ACTUAL_SERVER_URL',
    'ACTUAL_SERVER_PASSWORD', 
    'BUDGET_ID'
  ];
  
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API client | Custom HTTP wrapper | @actual-app/api | Official library handles sync, caching, encryption |
| Budget loading | Manual file download | downloadBudget() | Handles local caching, E2E encryption |
| Transaction query | REST API | getTransactions() | Uses Actual's internal query engine |

## Common Pitfalls

### Pitfall 1: Missing E2E Encryption Password
**What goes wrong:** Budget fails to download with cryptic error
**Why it happens:** Budget has end-to-end encryption enabled but no password provided
**How to avoid:** Check for `ACTUAL_E2E_PASSWORD` env var, provide if budget is encrypted
**Warning signs:** Error message "Failed to download budget" with no further details

### Pitfall 2: Wrong Date Range
**What goes wrong:** No transactions returned
**Why it happens:** Using wrong date format or very narrow range
**How to avoid:** Use ISO format 'YYYY-MM-DD', wide range like '1990-01-01' to '2030-01-01'
**Warning signs:** Empty transaction arrays despite known transactions

### Pitfall 3: Concurrent Budget Access
**What goes wrong:** Database lock errors, out-of-sync data
**Why it happens:** Multiple processes accessing same cached budget
**How to avoid:** Use file locking (see actual-ai's lock mechanism) or unique dataDir per instance
**Warning signs:** "database is locked" errors

### Pitfall 4: Filtering Uncategorized Incorrectly
**What goes wrong:** Including transfers, starting balances, or already-categorized
**Why it happens:** Only checking `!transaction.category` without additional filters
**How to avoid:** Apply full filter chain from actual-ai's TransactionFilterer
**Warning signs:** Processing wrong transactions, duplicates

## Code Examples

### Complete API Service Wrapper
```typescript
// src/services/actual-api.ts
import actual from '@actual-app/api';
import fs from 'fs';
import path from 'path';

interface ActualBudgetConfig {
  serverUrl: string;
  password: string;
  budgetId: string;
  e2ePassword?: string;
  dataDir?: string;
}

export class ActualApiService {
  private initialized = false;
  private config: ActualBudgetConfig;
  
  constructor(config: ActualBudgetConfig) {
    this.config = {
      dataDir: '/tmp/actual-telegram-notif/',
      ...config
    };
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Ensure data directory exists
    if (!fs.existsSync(this.config.dataDir)) {
      fs.mkdirSync(this.config.dataDir, { recursive: true });
    }
    
    await actual.init({
      dataDir: this.config.dataDir,
      serverURL: this.config.serverUrl,
      password: this.config.password,
    });
    
    const downloadOptions = this.config.e2ePassword 
      ? { password: this.config.e2ePassword }
      : {};
      
    await actual.downloadBudget(this.config.budgetId, downloadOptions);
    this.initialized = true;
  }
  
  async getUncategorizedTransactions() {
    const accounts = await actual.getAccounts();
    let transactions: any[] = [];
    
    for (const account of accounts) {
      // Skip off-budget accounts
      if (account.offbudget) continue;
      
      const accountTransactions = await actual.getTransactions(
        account.id,
        '1990-01-01',
        '2030-01-01'
      );
      transactions = transactions.concat(accountTransactions);
    }
    
    // Filter: no category, not transfer, not starting balance
    return transactions.filter(t => 
      !t.category && 
      !t.transfer_id && 
      !t.starting_balance_flag
    );
  }
  
  async getCategories() {
    return actual.getCategories();
  }
  
  async getCategoryGroups() {
    return actual.getCategoryGroups();
  }
  
  async updateTransactionCategory(transactionId: string, categoryId: string) {
    return actual.updateTransaction(transactionId, { category: categoryId });
  }
  
  async shutdown(): Promise<void> {
    await actual.shutdown();
  }
}
```

### Usage in Bot
```typescript
// src/index.ts
import { Bot } from 'grammy';
import 'dotenv/config';
import { authMiddleware } from './middleware/auth.js';
import { ActualApiService } from './services/actual-api.js';

// Validate required env vars
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

// Initialize API service
const actualApi = new ActualApiService({
  serverUrl: process.env.ACTUAL_SERVER_URL!,
  password: process.env.ACTUAL_SERVER_PASSWORD!,
  budgetId: process.env.BUDGET_ID!,
  e2ePassword: process.env.ACTUAL_E2E_PASSWORD,
});

await actualApi.initialize();

// Initialize bot
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
bot.use(authMiddleware);

// ... rest of bot setup
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual HTTP API | @actual-app/api library | 2022+ | Official client handles sync, encryption, caching |
| REST endpoints | Internal message passing | Always | Actual doesn't expose HTTP API, uses IPC |

**Deprecated/outdated:**
- None - this is the current standard approach

## Environment Variables

Based on actual-ai's implementation:

| Variable | Required | Description |
|----------|----------|-------------|
| ACTUAL_SERVER_URL | Yes | URL of Actual server (e.g., http://localhost:5006) |
| ACTUAL_SERVER_PASSWORD | Yes | Server password |
| BUDGET_ID | Yes | Budget sync ID from Settings → Show advanced settings → Sync ID |
| ACTUAL_E2E_PASSWORD | No | End-to-end encryption password if enabled |

**Note:** The CONTEXT.md specifies these exact variable names. The implementation must match.

## Open Questions

1. **Category Caching**
   - What we know: Categories change rarely, can be cached
   - What's unclear: How often to refresh? On startup only or periodic?
   - Recommendation: Cache at startup for MVP, refresh if user requests

2. **Transaction Date Range**
   - What we know: Need wide range to catch all transactions
   - What's unclear: Should we limit to last 30 days for performance?
   - Recommendation: Use full range for now, optimize if needed

3. **Polling Interval**
   - What we know: Phase 4 will poll every 4 hours
   - What's unclear: Should Phase 2 support manual refresh trigger?
   - Recommendation: Build fetch method that can be called on demand

## Sources

### Primary (HIGH confidence)
- https://actualbudget.org/docs/api/ - Official API documentation
- https://actualbudget.org/docs/api/reference - API method reference
- https://github.com/sakowicz/actual-ai - Reference implementation (420 stars)

### Secondary (MEDIUM confidence)
- https://github.com/actualbudget/actual/tree/master/packages/api - Source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official library, verified docs
- Architecture: HIGH - Based on actual-ai production code
- Pitfalls: MEDIUM - Derived from actual-ai issues and docs

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days for stable API)
