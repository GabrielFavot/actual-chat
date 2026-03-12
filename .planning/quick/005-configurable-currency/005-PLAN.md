# Quick Task 005: Make Currency Configurable via Environment Variable

**Objective:** Allow user to set currency via `CURRENCY` env var instead of trying to detect from API

**Duration:** ~10 min  
**Scope:** 2 small tasks

---

## Problem

The `getBudgetCurrency()` method tries to detect currency from accounts but:
1. Accounts don't have a currency field in the API
2. API doesn't expose budget currency anywhere
3. Always defaults to USD

**Solution:** Make it configurable via environment variable.

---

## Tasks

### Task 1: Add CURRENCY to .env.example and validation

**File:** `.env.example`

Add:
```env
# Currency code for displaying amounts (USD, EUR, GBP, etc.)
CURRENCY=USD
```

**File:** `src/utils/config-validator.ts`

Add currency validation:
```typescript
if (process.env.CURRENCY) {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'INR', 'CNY', 'SEK', 'NOK', 'DKK'];
  if (!validCurrencies.includes(process.env.CURRENCY)) {
    throw new Error(`Invalid CURRENCY: ${process.env.CURRENCY}. Must be one of: ${validCurrencies.join(', ')}`);
  }
}
```

**Success:** Config validator accepts and validates CURRENCY

---

### Task 2: Update ActualApiService to use env currency

**File:** `src/services/actual-api.ts`

**Changes:**
1. Remove `getBudgetCurrency()` method (no longer needed)
2. In `constructor`, set currency from env var:
   ```typescript
   this.currency = process.env.CURRENCY || 'USD';
   ```
3. Remove the try-to-detect-from-accounts logic

**Update callers:**
- `src/commands/transaction.ts` - Remove `await actualApi.getBudgetCurrency()`
- `src/handlers/category-callback.ts` - Remove `await actualApi.getBudgetCurrency()`

---

## Testing

1. Set in `.env`: `CURRENCY=EUR`
2. Send `/transaction`
3. Verify: Amount shows with € symbol and comma (€5,50)
4. Success message also uses € and comma

---

**Created:** 2026-03-12
