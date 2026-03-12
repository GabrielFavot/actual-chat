# Quick Task 001: Add /help Command

**Objective:** Add `/help` command to list all available bot commands with descriptions

**Duration:** ~10 min  
**Scope:** 2 small tasks

---

## Context

Bot currently has 4 commands:
- `/start` - Show user's Telegram ID
- `/uncategorized` - Count uncategorized transactions
- `/categories` - Count available categories
- `/transaction` - Display uncategorized transaction with category buttons

Users have no way to discover these commands. Add `/help` command to list them.

---

## Tasks

### Task 1: Create help command handler

**File:** `src/commands/help.ts`

```typescript
export async function handleHelpCommand(ctx: Context): Promise<void> {
  const helpMessage = `🤖 <b>Available Commands</b>

<b>/start</b>
Get your Telegram ID (needed for setup)

<b>/transaction</b>
View next uncategorized transaction with category buttons
2-tap workflow: see transaction → tap category → categorize

<b>/uncategorized</b>
Check how many uncategorized transactions exist

<b>/categories</b>
Check how many categories are available

<b>/help</b>
Show this message`;

  await ctx.reply(helpMessage, { parse_mode: 'HTML' });
}
```

**Success:** Handler created, no errors

---

### Task 2: Register /help command in bot

**File:** `src/index.ts`

1. Import: `import { handleHelpCommand } from './commands/help.js';`
2. Register: `bot.command('help', (ctx) => handleHelpCommand(ctx));`
3. Place after `/transaction` command registration

**Success:** Command registered, builds without errors

---

## Acceptance Criteria

- [ ] `src/commands/help.ts` created with handler
- [ ] Handler returns formatted message with all commands
- [ ] `/help` registered in `src/index.ts`
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors

---

## Testing

Manual: Send `/help` to bot → receive command list with descriptions

---

**Created:** 2026-03-12
