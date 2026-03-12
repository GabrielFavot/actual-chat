# Quick Task 002: Fix Payee Display and Currency Handling

**Objective:** Fix payee showing as UUID instead of name, and hardcoded $ currency

**Duration:** ~15 min  
**Scope:** 2 tasks

---

## Problems

1. **Payee displaying as UUID:** `8dd425d8-f69d-4676-9d37-b11711835fa7` instead of actual payee name
   - The `payee_name` field isn't being populated from API
   - Need to fetch actual payee name from ActualBudget

2. **Currency hardcoded to $:** All amounts show as `$` even for EUR users
   - Need to detect budget currency from ActualBudget
   - Format amounts with correct symbol (€, $, £, etc.)

---

## Tasks

### Task 1: Enhance ActualApiService to return payee names and currency

**File:** `src/services/actual-api.ts`

**Changes:**
1. Add method to get budget currency: `async getBudgetCurrency(): Promise<string>`
   - Query ActualBudget API for budget details
   - Return currency code (e.g., "USD", "EUR")

2. Enhance `getUncategorizedTransactions()` to populate payee names
   - When fetching transactions, also fetch payee objects
   - Map `payee_id` → actual payee name
   - Populate `payee_name` field properly

**Success:** Methods added, payee names populated, currency detectable

---

### Task 2: Update message formatter to use correct currency

**File:** `src/utils/message-formatter.ts`

**Changes:**
1. Enhance `formatAmount()` to accept currency parameter
   ```typescript
   export function formatAmount(
     amount: number,
     currency: string = "USD"
   ): string {
     // Format with correct symbol based on currency code
   }
   ```

2. Create currency symbol mapping:
   ```typescript
   const CURRENCY_SYMBOLS: Record<string, string> = {
     "USD": "$",
     "EUR": "€",
     "GBP": "£",
     "JPY": "¥",
     // ... etc
   };
   ```

3. Update `formatTransaction()` to accept and use currency
   ```typescript
   export function formatTransaction(
     transaction: Transaction,
     currency: string = "USD",
     accountName?: string
   ): string
   ```

4. Update all callers (transaction command, callbacks) to pass currency

**Success:** Currency symbols correct, amounts display with right symbol

---

## Testing

Manual:
1. Send `/transaction`
2. Verify: Payee shows real name (not UUID)
3. Verify: Amount shows € (or local currency) not $

---

**Created:** 2026-03-12
