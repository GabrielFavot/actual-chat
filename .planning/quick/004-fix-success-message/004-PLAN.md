# Quick Task 004: Fix Success Message - Show Real Payee Name and Currency

**Objective:** Fix success message showing UUID instead of payee name, and not using correct currency

**Duration:** ~5 min  
**Scope:** 1 simple task

---

## Problem

When user taps category button, the success message shows:
```
Transaction from adc17fb2-b0ef-4997-9822-d242dade0300 → Bills • -$3.00
```

Should show:
```
Transaction from Coffee Shop → Bills • -€3,00
```

Issues:
1. `updatedTransaction.payee_name` is null (stored transaction doesn't have it)
2. Currency defaults to USD instead of using budget currency

---

## Task

### Task 1: Fix callback handler to use proper data

**File:** `src/handlers/category-callback.ts`

**Changes:**
1. The `transaction` retrieved from session is the OLD version (before update)
2. Use `updatedTransaction` returned from API (has fresh data)
3. Get payee_name from updatedTransaction, not stored transaction
4. Payee name might still be UUID in updatedTransaction - use category name instead

**Fix:**
```typescript
// Use payee_name from updated transaction (from API)
const payeeName = updatedTransaction.payee_name || updatedTransaction.payee || 'Transaction';

// Or simpler: just show category name for success
const successMessage = formatSuccess(
  payeeName || 'Transaction',
  category.name,
  updatedTransaction.amount,
  currency
);
```

Actually, the real issue: `updatedTransaction` might not have payee_name either because `updateTransaction()` just returns what the API gave us.

Better fix: Fetch payees map and look up the payee name properly.

---

## Solution

In callback handler, after getting updatedTransaction:

```typescript
const payeeMap = await actualApi.getPayeesMap();
const payeeName = payeeMap.get(updatedTransaction.payee || '') 
  || updatedTransaction.imported_payee 
  || 'Transaction';
```

This ensures we get the real payee name before showing success message.

---

**Created:** 2026-03-12
