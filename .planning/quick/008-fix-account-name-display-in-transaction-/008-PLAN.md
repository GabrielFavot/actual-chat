# Quick Task 008: Fix Account Name Display in Transaction Form

## Goal
Display actual account names instead of "Unknown Account" in the transaction form.

## Current State
- Transaction command fetches transactions with `account_id` but doesn't resolve account name
- Message formatter shows "Unknown Account" as fallback
- API already has `getAccounts()` method available
- Need to add account name lookup capability

## Tasks

### Task 1: Add getAccount method to ActualApiService
**File:** `src/services/actual-api.ts`

**Changes:**
1. Create a method `getAccount(accountId: string)` that returns a single account with its name
2. Cache accounts for performance (avoid repeated API calls)
3. Return account object with at least `id` and `name` fields

**Pattern:**
```typescript
async getAccount(accountId: string): Promise<Account> {
  // Use accounts cache if available
  // Otherwise fetch all accounts and cache them
  // Return the matching account
}
```

### Task 2: Update transaction command to fetch account name
**File:** `src/commands/transaction.ts`

**Changes:**
1. After fetching the first transaction, get its account ID
2. Call `actualApi.getAccount(transaction.account_id)` to get account details
3. Pass `accountName` to `formatTransaction(transaction, accountName)`
4. Handle error case if account not found

## Acceptance Criteria
- [ ] `getAccount` method exists in ActualApiService
- [ ] Account names are properly displayed in transaction form
- [ ] No more "Unknown Account" messages
- [ ] Accounts are cached for performance
- [ ] TypeScript compilation passes
- [ ] Error handling for missing accounts
