# Quick Task 005: Remove Currency Complexity - Simplify to Amount Only

**Objective:** Remove currency detection complexity, just show amounts as numbers

**Duration:** ~10 min  
**Scope:** Remove currency code, simplify formatters

---

## Problem

API doesn't expose budget currency reliably, and trying to detect/configure it adds complexity.

**Solution:** Just show amounts without currency symbols. Works for everyone.

**Before:**
```
Amount: -€5,50
```

**After:**
```
Amount: -5.50
```

Simple, clean, no config needed.

---

## Tasks

### Task 1: Simplify formatAmount()

**File:** `src/utils/message-formatter.ts`

**Remove:**
- Currency symbol mapping
- Currency parameter
- Decimal separator logic

**New simple version:**
```typescript
export function formatAmount(amount: number): string {
  const absAmount = Math.abs(amount) / 100;
  const sign = amount < 0 ? '-' : '+';
  return `${sign}${absAmount.toFixed(2)}`;
}
```

---

### Task 2: Remove currency from all callers

**Files to update:**
- `src/commands/transaction.ts` - Remove currency fetching/passing
- `src/handlers/category-callback.ts` - Remove currency fetching/passing
- `src/services/actual-api.ts` - Remove `getBudgetCurrency()` and `CURRENCY_SYMBOLS`

**Update messages:**
```typescript
// Transaction display
formatTransaction(transaction)  // No currency param

// Success message
formatSuccess(payeeName, categoryName, amount)  // No currency param
```

---

## Result

Clean, simple, no configuration needed.

**Before:**
```
Amount: -€5,50
✅ Transaction from Coffee Shop → Bills • -€5,50
```

**After:**
```
Amount: -5.50
✅ Transaction from Coffee Shop → Bills • -5.50
```

---

**Created:** 2026-03-12
