# Setup Guide - Step by Step

This guide will walk you through getting all the configuration values you need to run the bot.

## Step 1: Get Telegram Bot Token

### What is it?
The token authenticates your bot with Telegram's servers. It's like a password for your bot.

### How to get it:

1. Open Telegram and search for **@BotFather**
2. Send `/start` to BotFather
3. Send `/newbot`
4. BotFather will ask:
   - "Alright, a new bot. How are we going to call it?" → Enter any name, e.g., `ActualBudget Bot`
   - "Good. Now let's choose a username..." → Enter a unique username, e.g., `actualbudget_notifier_bot`
5. BotFather responds with your token:
   ```
   Use this token to access the HTTP API:
   123456789:ABCdefGHIjklmnoPQRstuvWXYZ
   ```

**Copy this token to `.env`:**
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvWXYZ
```

---

## Step 2: Get Your Telegram User ID

### What is it?
Your unique Telegram identifier. Needed so only you can control the bot.

### How to get it:

1. Open Telegram and find your new bot
2. Send `/start` to the bot
3. The bot replies:
   ```
   Welcome! Your Telegram ID is: 987654321
   ```

**Copy this ID to `.env`:**
```env
AUTHORIZED_USER_IDS=987654321
```

**For multiple users**, use comma-separated IDs:
```env
AUTHORIZED_USER_IDS=987654321,123456789,555555555
```

---

## Step 3: Get ActualBudget Configuration

### What you need:
- `ACTUAL_SERVER_URL` - Where ActualBudget runs
- `ACTUAL_SERVER_PASSWORD` - Server sync password (NOT your login password)
- `BUDGET_ID` - The budget to monitor

### How to get them:

#### 1. Find the Server URL

Where is your ActualBudget running?

**Docker/Coolify:**
```env
ACTUAL_SERVER_URL=http://actual:5006
```

**Self-hosted (local):**
```env
ACTUAL_SERVER_URL=http://localhost:5006
```

**Remote server:**
```env
ACTUAL_SERVER_URL=https://budget.example.com
```

#### 2. Find the Server/Sync Password

⚠️ **This is NOT your login password!**

1. Open ActualBudget
2. Click **Settings** (gear icon, top-right)
3. Look for **"Sync"** section
4. You should see your **server password** or **sync password** displayed
   - This is what you set when first setting up ActualBudget
   - If you forgot it, check your initial setup docs or ask your server admin

**Copy to `.env`:**
```env
ACTUAL_SERVER_PASSWORD=your_sync_password_here
```

#### 3. Find the Budget ID

1. Open ActualBudget
2. Click **Settings** (gear icon, top-right)
3. Scroll down and enable **"Show advanced settings"**
4. Look for **"Sync ID"** or **"Budget ID"**
   - It looks like: `550e8400-e29b-41d4-a716-446655440000`

**Copy to `.env`:**
```env
BUDGET_ID=550e8400-e29b-41d4-a716-446655440000
```

---

## Step 4: Optional - End-to-End Encryption Password

### When do I need this?

Only if your ActualBudget budget has **encryption enabled**.

### How to check:

1. Open ActualBudget
2. Go to Settings → Show advanced settings
3. Look for an encryption section or password field
4. If you see "Encryption enabled" or similar, you need this

### What is it?

The password that encrypts your budget data. Usually only needed if you enabled encryption during budget creation.

**Add to `.env` if needed:**
```env
ACTUAL_E2E_PASSWORD=your_encryption_password
```

If unsure, leave it commented out or skip it for now.

---

## Step 5: Create and Fill `.env` File

### From template:

```bash
cp .env.example .env
```

### Edit `.env` with your values:

```env
# === TELEGRAM CONFIGURATION ===

# Your bot token from @BotFather
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvWXYZ

# Your Telegram user ID(s) that can use the bot
AUTHORIZED_USER_IDS=987654321


# === ACTUALBUDGET CONFIGURATION ===

# URL where your ActualBudget instance is running
ACTUAL_SERVER_URL=http://actual:5006

# Your ActualBudget server/sync password (NOT your login password)
ACTUAL_SERVER_PASSWORD=your_sync_password

# The budget ID to monitor (from Settings → Show advanced → Sync ID)
BUDGET_ID=550e8400-e29b-41d4-a716-446655440000

# Optional: E2E encryption password (only if your budget uses encryption)
# ACTUAL_E2E_PASSWORD=your_encryption_password
```

---

## Step 6: Verify Configuration

Before running the bot, test that everything works:

```bash
npm run test:setup
```

You should see output like:

```
╔════════════════════════════════════════════════════════════╗
║  ActualBudget Telegram Bot - Setup Verification           ║
╚════════════════════════════════════════════════════════════╝

Step 1: Checking Configuration...

✓ All configuration variables present and valid

Step 2: Checking Telegram Configuration...

  Bot Token: 123456789...Z
  Authorized User IDs: 987654321

✓ Telegram configuration loaded

Step 3: Testing ActualBudget Connection...

  Connecting to: http://actual:5006
  Budget ID: 550e8400-e29b-41d4-a716-446655440000

✓ Successfully connected to ActualBudget

Step 4: Fetching Sample Data...

  Uncategorized Transactions: 5
    Sample: 2026-03-12 | Coffee Shop | -5.50
  Available Categories: 24
    Sample: Groceries, Utilities, Entertainment

✓ Data fetch successful

╔════════════════════════════════════════════════════════════╗
║  ✓ ALL SYSTEMS GO!                                         ║
╚════════════════════════════════════════════════════════════╝

You can now run: npm start
```

If you see errors, the script will tell you what's wrong and how to fix it.

---

## Step 7: Start the Bot

Once verification passes:

```bash
npm start
```

You should see:

```
Initializing ActualBudget API...
Connecting to ActualBudget...
✓ ActualBudget API initialized successfully

Setting up bot commands...
✓ Bot commands registered

🤖 Bot starting... waiting for messages
```

The bot is now running and listening for messages!

---

## Testing

Send these messages to your bot to verify it works:

```
/start          → Bot replies with your Telegram ID
/uncategorized  → Shows how many uncategorized transactions exist
/categories     → Shows how many categories are available
```

---

## Troubleshooting

### "Configuration Issues Found"

The script will show which values are missing or invalid. Go back to the relevant step above and get the correct value.

### "Cannot connect to ActualBudget"

- Check `ACTUAL_SERVER_URL` is correct
- Verify ActualBudget is running on that URL
- Test by visiting the URL in your browser
- Check network connectivity

### "Authentication failed"

- Verify `ACTUAL_SERVER_PASSWORD` (your **sync** password, not login)
- Verify `BUDGET_ID` is correct (from Settings → Show advanced)
- If budget uses encryption, set `ACTUAL_E2E_PASSWORD`

### "Telegram bot not responding"

- Check `TELEGRAM_BOT_TOKEN` is from @BotFather
- Check `AUTHORIZED_USER_IDS` contains your ID
- Verify bot is running (`npm start`)
- Try sending `/start` again

---

## Next Steps

- Bot is set up and running
- Currently it responds to test commands (`/start`, `/uncategorized`, `/categories`)
- Full UI for categorizing transactions is coming in Phase 3
- Automatic 4-hour polling is coming in Phase 4

For now, you can use the test commands to verify everything is working!

---

**Questions?** Check the main [README.md](README.md) or troubleshooting section above.
