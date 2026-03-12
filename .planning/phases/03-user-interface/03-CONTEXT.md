# Phase 3 Context: User Interface

**Phase:** 3 of 4  
**Name:** User Interface  
**Goal:** Users can categorize transactions via inline keyboard buttons with 2-tap workflow

## Deliverables from Phase 2

Phase 2 Integration (complete) provides:
- ActualApiService class with:
  - `initialize()` - Connects to ActualBudget
  - `getUncategorizedTransactions()` - Fetches uncategorized txns
  - `getCategories()` - Fetches available categories
  - ❓ Need to verify if `updateTransaction()` exists for categorizing
- Bot entry point with credential validation
- Test commands `/uncategorized` and `/categories`
- Authorization middleware (only authorized users)

## Phase 3 Requirements

From ROADMAP.md:

| Req | Description |
|-----|-------------|
| INT-04 | Bot updates transaction with selected category via API |
| UI-01 | Bot displays transaction details (amount, payee, date, account) |
| UI-02 | Bot presents categories as inline keyboard buttons |
| UI-03 | User can tap category button to categorize (2-tap workflow) |
| UI-04 | Bot sends one transaction per notification (no batching) |

## Success Criteria

1. ✓ User receives notification with: amount, payee, date, account
2. ✓ Inline keyboard shows all categories as buttons
3. ✓ Tapping category button updates transaction in ActualBudget
4. ✓ Confirmation message after successful categorization
5. ✓ Only one transaction per message

## Implementation Plan

### Phase 3 consists of 3 plans:

#### Plan 03-01: Enhance ActualApiService with Update Capability
**Objective:** Add ability to categorize transactions (update transaction category)

**Tasks:**
1. Verify/implement `updateTransaction(transactionId, categoryId)` in ActualApiService
2. Test update functionality works correctly
3. Handle errors (transaction not found, invalid category)

**Dependencies:** None (builds on Phase 2 API service)

**Output:** ActualApiService can now read AND write transactions

---

#### Plan 03-02: Create Transaction Display Command
**Objective:** Fetch uncategorized transaction and display with category buttons

**Tasks:**
1. Create `/transaction` command that:
   - Fetches first uncategorized transaction
   - Displays: date, payee, amount, account
   - Shows inline keyboard with all categories as buttons
2. Handle case: no uncategorized transactions (show message)
3. Add error handling for API failures

**Dependencies:** Plan 03-01 (needs ActualApiService ready)

**Output:** User can request `/transaction` and see transaction with buttons

---

#### Plan 03-03: Implement Category Button Handler
**Objective:** Handle button clicks to categorize and show confirmation

**Tasks:**
1. Register callback query handler for category buttons
2. When button clicked:
   - Get transaction ID from callback data
   - Get selected category ID from button
   - Call `updateTransaction(txn_id, category_id)`
   - Show confirmation: "✓ Categorized as [Category]"
3. Handle errors (transaction already categorized, API errors)
4. Delete original message with buttons (or edit to show result)

**Dependencies:** Plan 03-02 (needs transaction display)

**Output:** 2-tap workflow works: command → see txn → tap category → done

---

## Technical Notes

### Inline Keyboard Structure (grammY)

```typescript
// Create inline keyboard with categories
const keyboard = new InlineKeyboard();
categories.forEach(cat => {
  keyboard.text(cat.name, `cat_${cat.id}`);  // button text, callback data
});

// Send message with keyboard
await ctx.reply('Select category:', { reply_markup: keyboard });

// Handle callback in middleware
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data; // e.g., 'cat_123'
  // ... categorize transaction
  await ctx.answerCallbackQuery();
});
```

### Transaction Update in ActualBudget

Need to check @actual-app/api documentation for transaction update API:
- Method likely: `await actual.updateTransaction(txnId, updates)`
- Or: `await actual.setTransactionCategory(txnId, categoryId)`

### Callback Data Size

grammY inline buttons have callback_data limit (~64 chars).
For large transaction IDs, may need to store in memory cache or database.

Current plan: Include transaction ID in callback data string.
- Callback format: `cat_{categoryId}_{transactionId}`
- Keep transaction context in command handler scope

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Transaction ID too large for callback data | Store txn context in memory map, use shorter key in button |
| User categorizes, then uses `/transaction` again | Each `/transaction` gets fresh uncategorized txn (no conflict) |
| API fails during categorization | Catch error, show user "Failed to categorize. Try again." |
| Category not found | Validate category ID before creating button |

## Testing Strategy

1. Unit: ActualApiService.updateTransaction() works
2. Integration: Full flow - fetch txn → display → click button → confirm
3. Manual: Test with real ActualBudget instance

## Files to Create/Modify

| File | Type | Purpose |
|------|------|---------|
| `src/services/actual-api.ts` | Modify | Add updateTransaction method |
| `src/commands/transaction.ts` | Create | /transaction command handler |
| `src/handlers/category-callback.ts` | Create | Callback query handler |
| `src/index.ts` | Modify | Register new command & handler |

## Next Phase (Phase 4)

After Phase 3 completes, Phase 4 will:
- Add scheduled job to check every 4 hours
- Send notifications proactively (not wait for `/transaction` command)
- Track which transactions have been notified (avoid duplicates)

---

**Created:** 2026-03-12  
**Status:** Ready for planning
