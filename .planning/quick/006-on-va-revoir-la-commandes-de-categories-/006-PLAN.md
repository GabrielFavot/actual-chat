# Quick Task 006: Review and Enhance /categories Command

**Objective:** Enhance the /categories command to display all categories (main + subcategories) instead of just count

**Duration:** ~15 min  
**Scope:** Update /categories command to show detailed category list

---

## Problem

Current `/categories` command only shows a count:
```
Found 42 categories
```

User wants to see the actual category list with main categories and their subcategories.

---

## Tasks

### Task 1: Analyze current category structure

**File:** `src/index.ts` (lines 70-78)

**Current implementation:**
```typescript
bot.command('categories', async (ctx) => {
  try {
    const categories = await actualApi.getCategories();
    await ctx.reply(`Found ${categories.length} categories`);
  } catch (error) {
    console.error('Error fetching categories:', error);
    await ctx.reply('Error fetching categories. Check logs.');
  }
});
```

**Action:** 
- Check category object structure from API
- Identify which categories are main vs. subcategories (usually indicated by `parentId` field)
- Determine hierarchy

---

### Task 2: Create category formatter function

**File:** `src/utils/message-formatter.ts`

**Create:** `formatCategoryList()` function to:
- Organize categories by parent/child relationship
- Format output with hierarchy indentation
- Display both main and sub categories clearly

**Example output:**
```
📁 Bills
  ├─ Electricity
  ├─ Water
  └─ Rent
📁 Entertainment
  ├─ Movies
  ├─ Games
  └─ Streaming
```

---

### Task 3: Update /categories command

**File:** `src/index.ts` (lines 70-78)

**Update:** Replace simple count with formatted category list:
```typescript
bot.command('categories', async (ctx) => {
  try {
    const categories = await actualApi.getCategories();
    const formatted = formatCategoryList(categories);
    await ctx.reply(formatted, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error fetching categories:', error);
    await ctx.reply('Error fetching categories. Check logs.');
  }
});
```

---

## Success Criteria

- [x] `/categories` command displays full category hierarchy
- [x] Main categories and subcategories clearly distinguished
- [x] Clean, readable formatting (indentation or bullets)
- [x] No errors in API calls
- [x] Function is reusable (in `message-formatter.ts`)

---

**Created:** 2026-03-12
