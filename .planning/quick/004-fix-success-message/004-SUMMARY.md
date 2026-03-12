---
quick_task: 004
description: Fix success message showing UUID and not using currency
duration: 5min
completed: 2026-03-12
---

# Quick Task 004 Summary: Fix Success Message Display

**Fix success message showing payee UUID instead of name, and using wrong currency**

## Problem

After categorizing, success message showed:
```
❌ Transaction from adc17fb2-b0ef-4997-9822-d242dade0300 → Bills • -$3.00
```

Should show:
```
✅ Transaction from Coffee Shop → Bills • -€3,00
```

Issues:
1. Using `updatedTransaction.payee_name` which is null
2. Using default currency instead of budget currency

## Solution

Updated callback handler to:
1. Fetch payee map from API
2. Look up real payee name using payee ID from transaction
3. Already fetching currency (was there, just wasn't used)

```typescript
const payeeMap = await actualApi.getPayeesMap();
const payeeName = updatedTransaction.payee 
  ? (payeeMap.get(updatedTransaction.payee) || updatedTransaction.payee_name || 'Transaction')
  : (updatedTransaction.payee_name || 'Transaction');
```

## Testing

**Before:**
```
✅ Categorized!
Transaction from adc17fb2-b0ef-4997-9822-d242dade0300 → Bills • -$3.00
```

**After (EUR budget):**
```
✅ Categorized!
Transaction from Coffee Shop → Bills • -€3,00
```

**After (USD budget):**
```
✅ Categorized!
Transaction from Coffee Shop → Bills • -$3.00
```

## Changes

- `src/handlers/category-callback.ts` - Fetch and use real payee names from cache

---

**Quick Task 004 Complete** ✅
