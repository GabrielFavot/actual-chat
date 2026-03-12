# Quick Task 007: Display Category Groups in Transaction Form

## Goal
Improve the `/transaction` command to display categories organized by their groups, making it easier for users to find categories in budgets with many categories.

## Current State
- Transaction form shows all categories in a flat 2-button-per-row layout
- API service has `getCategoryGroups()` method available
- Categories have `group_id` field but aren't organized by group in the UI

## Tasks

### Task 1: Update transaction.ts to fetch and organize categories by groups
**File:** `src/commands/transaction.ts`

**Changes:**
1. Fetch categories with their group_id
2. Fetch category groups mapping
3. Organize categories by group_id before building the keyboard
4. Pass both organized categories and group names to the formatting function

**Implementation pattern:**
- Create a Map to group categories by group_id
- Ensure categories without a group go into an "Uncategorized" group
- Pass group data to the keyboard builder

### Task 2: Update transaction.ts keyboard building to display groups
**Same file:** `src/commands/transaction.ts` 

**Changes:**
1. Build keyboard with group headers (as separator-like buttons or text)
2. Add categories under their respective group headers
3. Maintain 2-button-per-row layout within each group
4. Handle edge cases (empty groups, single category groups)

**Approach:**
- Use category group names as visual separators
- Group buttons by category.group_id
- Add row() before each new group for visual separation

## Acceptance Criteria
- [ ] Categories are displayed grouped by their category group
- [ ] Group names are visible as organizational elements
- [ ] 2-button-per-row layout is maintained within each group
- [ ] Categories without a group are clearly separated
- [ ] No keyboard button callback data is broken
- [ ] Code compiles without errors
