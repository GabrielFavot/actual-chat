# ActualBudget Telegram Notifier

A Telegram bot that monitors your self-hosted ActualBudget instance and notifies you of uncategorized transactions.

**Status:** Phase 2 complete - Bot connects to ActualBudget and fetches transactions/categories

## Quick Start

### Prerequisites
- Node.js 20+
- ActualBudget instance running
- Telegram bot token (create with @BotFather)

### Setup

1. **Install and build:**
   ```bash
   npm install
   npm run build
   ```

2. **Get credentials:**
   - `TELEGRAM_BOT_TOKEN` - from @BotFather on Telegram
   - `AUTHORIZED_USER_IDS` - your Telegram ID (get it by sending `/start` to your bot)
   - `ACTUAL_SERVER_URL` - where ActualBudget runs (e.g., `http://actual:5006`)
   - `ACTUAL_SERVER_PASSWORD` - your ActualBudget sync password
   - `BUDGET_ID` - from ActualBudget Settings → Show advanced settings → Sync ID

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   
   Fill with your values:
   ```env
   TELEGRAM_BOT_TOKEN=your_token_here
   AUTHORIZED_USER_IDS=your_user_id
   ACTUAL_SERVER_URL=http://actual:5006
   ACTUAL_SERVER_PASSWORD=your_password
   BUDGET_ID=your_budget_id
   ```

4. **Start the bot:**
   ```bash
   npm start
   ```

5. **Test it works:**
   - Send `/start` to your bot → shows your Telegram ID
   - Send `/uncategorized` → shows uncategorized transaction count
   - Send `/categories` → shows available categories

## Available Commands

- `/start` - Get your Telegram ID
- `/uncategorized` - Check uncategorized transactions
- `/categories` - Check available categories

## Project Structure

```
src/
├── index.ts                 # Bot entry point
├── middleware/auth.ts       # Authorization
├── services/actual-api.ts   # ActualBudget API client
└── utils/config-validator.ts # Configuration validation
```

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript
- **Bot Framework:** grammY
- **ActualBudget Client:** @actual-app/api

## Scripts

```bash
npm run build      # Compile TypeScript
npm run dev        # Run with ts-node
npm start          # Start bot
```

## Configuration Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Token from @BotFather |
| `AUTHORIZED_USER_IDS` | Yes | Your Telegram user ID |
| `ACTUAL_SERVER_URL` | Yes | ActualBudget server URL |
| `ACTUAL_SERVER_PASSWORD` | Yes | Server sync password |
| `BUDGET_ID` | Yes | Budget ID from settings |
| `ACTUAL_E2E_PASSWORD` | No | E2E encryption password if enabled |

## Troubleshooting

**Configuration errors:** Run the bot with an incomplete `.env` to see exactly what's missing.

**ActualBudget connection fails:**
- Check `ACTUAL_SERVER_URL` is correct and accessible
- Verify `ACTUAL_SERVER_PASSWORD` (it's the sync password, not login)
- Verify `BUDGET_ID` is correct (from Settings → Show advanced)

**Bot doesn't respond:**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Verify your ID is in `AUTHORIZED_USER_IDS`
- Check bot is running (should see "Bot starting..." message)

## License

MIT
