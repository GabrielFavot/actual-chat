---
quick_task: 003
description: Fix payee names still showing as UUID
duration: 10min
completed: 2026-03-12
---

# Quick Task 003 Summary: Fix Payee Names UUID Display

**Debug and fix payee names not being populated correctly**

## Problem Found

The transaction field was incorrectly named:
- Used: `t.payee_id` ❌
- Actual field: `t.payee` (contains PayeeEntity ID) ✓
- Fallback: `t.imported_payee` (contains imported payee name) ✓

Also, account field mapping was wrong:
- Used: `t.account_id` ❌
- Actual field: `t.account` ✓

## Solution

Updated `getUncategorizedTransactions()` mapping:

```typescript
payee_name: t.payee 
  ? payeesMap.get(t.payee)    // Get name from cached payees
  : (t.imported_payee || 'Unknown')  // Fallback to imported name
```

This properly:
1. Looks up payee name from cached payee map if payee ID exists
2. Falls back to `imported_payee` if available
3. Shows "Unknown" only if neither exists

## Testing

**Before:**
```
Payee: 8dd425d8-f69d-4676-9d37-b11711835fa7
```

**After:**
```
Payee: Coffee Shop
```

Transaction payee names now display correctly! ✓

## Changes

- `src/services/actual-api.ts` - Fixed field names in transaction mapping
- Removed debug logging (no longer needed)

---

**Quick Task 003 Complete** ✅
