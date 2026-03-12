# Quick Task 003: Fix Payee Names Still Showing as UUID

**Objective:** Debug and fix payee names not being populated correctly

**Duration:** ~10 min  
**Scope:** Debug + fix

---

## Problem

Payee still shows as UUID even after Quick Task 002. The `getPayeesMap()` isn't working as expected.

Possible causes:
1. `actual.getPayees()` returns null or empty
2. Transactions don't have `payee_id` field, they have something else
3. Payee name mapping isn't being applied

---

## Tasks

### Task 1: Debug transaction structure

Add logging to see what fields transactions actually have.

**File:** `src/services/actual-api.ts`

In `getUncategorizedTransactions()`, before mapping:

```typescript
// Debug: Log first transaction to see structure
if (filtered.length > 0) {
  console.log('DEBUG: First transaction:', JSON.stringify(filtered[0], null, 2));
}
```

Run bot and check logs to see:
- What fields exist in transaction
- What the payee field is actually called
- If payee_id exists and what value it has

---

### Task 2: Fix payee mapping based on actual field names

Once we know the real field names:
1. Update `getPayeesMap()` if needed
2. Use correct field to look up payee name
3. Handle case where payee_id doesn't exist

**Possible fixes:**
- Transaction might have `payee` (string name) not `payee_id`
- Transaction might have `payee_name` already populated
- `actual.getPayees()` might not work, need different approach

---

## Testing

1. Run `npm run dev`
2. Send `/transaction`
3. Check server logs for DEBUG output
4. Based on logs, update mapping logic
5. Verify payee shows real name

---

**Created:** 2026-03-12
