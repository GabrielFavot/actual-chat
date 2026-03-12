---
quick_task: 005
description: Remove currency complexity - simplify to amount only
duration: 10min
completed: 2026-03-12
---

# Quick Task 005 Summary: Remove Currency Complexity

**Simplify amount display - remove currency symbol complexity**

## Problem Fixed

Currency detection from API is unreliable and adds unnecessary complexity.

## Solution

Display amounts as simple numbers without currency symbols.

**Before:**
```
Amount: -€5,50 or -$5,50 (depending on detection)
```

**After:**
```
Amount: -5.50 (universal, works everywhere)
```

## Changes

### src/utils/message-formatter.ts
- Removed currency symbol mapping (14 currencies)
- Removed currency detection logic
- Simplified `formatAmount()` to just format numbers
- Removed currency parameters from `formatTransaction()` and `formatSuccess()`

### src/services/actual-api.ts
- Removed `getBudgetCurrency()` method
- Removed currency field from class

### src/commands/transaction.ts
- Removed currency fetching
- Call `formatTransaction()` without currency parameter

### src/handlers/category-callback.ts
- Removed currency fetching
- Call `formatSuccess()` without currency parameter

## Result

Cleaner, simpler, no configuration needed, works universally.

**Example messages:**

Transaction display:
```
📝 Categorize Transaction

Date: 2026-03-10
Payee: Coffee Shop
Amount: -5.50
Account: Checking

[Groceries] [Restaurants]
```

Success message:
```
✅ Categorized!
Transaction from Coffee Shop → Bills • -5.50
```

Universal format, no currency guessing needed.

---

**Quick Task 005 Complete** ✅
