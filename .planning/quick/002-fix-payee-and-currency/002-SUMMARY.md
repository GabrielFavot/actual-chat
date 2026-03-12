---
quick_task: 002
description: Fix payee display showing UUID and hardcoded currency
duration: 15min
completed: 2026-03-12
---

# Quick Task 002 Summary: Fix Payee and Currency Display

**Fix payee names showing as UUIDs and add multi-currency support**

## Problems Fixed

1. ✅ **Payee was UUID instead of name**
   - Added `getPayeesMap()` to fetch and cache payee names
   - Enhanced `getUncategorizedTransactions()` to populate `payee_name` from payee ID
   - Transactions now show real payee names ("Coffee Shop") instead of IDs

2. ✅ **Currency was hardcoded to $**
   - Added `getBudgetCurrency()` to detect budget currency (EUR, USD, etc.)
   - Created currency symbol mapping (€ for EUR, $ for USD, £ for GBP, etc.)
   - Added decimal separator handling (comma for EUR, dot for others)
   - Updated formatAmount() to accept currency parameter
   - Transaction and success messages now show correct currency

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files modified:** 4

## Changes

### src/services/actual-api.ts
- Added `getPayeesMap()` - Caches payee ID → name mapping
- Added `getBudgetCurrency()` - Detects budget currency from accounts
- Enhanced `getUncategorizedTransactions()` - Populates payee names from cache
- Added Payee interface

### src/utils/message-formatter.ts
- Updated `formatAmount()` - Accepts currency parameter
- Added currency symbol mapping (14 currencies)
- Decimal separator handling (EUR uses comma, others use dot)
- Updated `formatTransaction()` - Accepts currency
- Updated `formatSuccess()` - Accepts amount and currency for full details

### src/commands/transaction.ts
- Gets budget currency and passes to formatTransaction()

### src/handlers/category-callback.ts
- Gets budget currency and passes to formatSuccess()
- Success message now shows amount with correct currency

## Examples

**Before:**
```
Payee: 8dd425d8-f69d-4676-9d37-b11711835fa7
Amount: -$79.59
```

**After (USD):**
```
Payee: Coffee Shop
Amount: -$79.59
```

**After (EUR):**
```
Payee: Coffee Shop
Amount: -€79,59
```

## Testing

Manual:
1. Set up bot with EUR budget
2. Send `/transaction`
3. Verify: Payee shows real name (not UUID) ✓
4. Verify: Amount shows € symbol with comma (€79,59) ✓
5. Tap button, confirm message shows correct currency ✓

## Supported Currencies

- USD ($), EUR (€), GBP (£), JPY (¥)
- CHF (CHF), CAD (C$), AUD (A$), NZD (NZ$)
- INR (₹), CNY (¥), SEK (kr), NOK (kr), DKK (kr)

---

**Quick Task 002 Complete** ✅
