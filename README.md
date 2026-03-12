# ActualBudget Telegram Notifier

Get transactions categorized with minimal friction — 2 taps and done, without opening Actual.

A Telegram bot that proactively monitors your self-hosted ActualBudget instance, detects uncategorized transactions, and asks you to categorize them via inline keyboard buttons.

## Features

- 🤖 **Automated monitoring** - Checks every 4 hours for uncategorized transactions
- ⚡ **Quick categorization** - 2-tap workflow: select category button and done
- 🔒 **Secure** - Only authorized users can interact
- 📱 **Telegram only** - Pure Telegram UI, no web interface needed
- 🏠 **Self-hosted** - Runs on your Coolify server alongside ActualBudget

## Quick Start

### Prerequisites

- Node.js 20+
- ActualBudget instance running (self-hosted)
- Telegram bot token (from @BotFather)
- Your Telegram user ID

### Installation

1. **Clone and setup:**
   ```bash
   git clone <repo>
   cd actual-telegram-notif
   npm install
   npm run build
   ```

2. **Get your configuration values:**

   **Telegram:**
   - 📱 Create a bot with [@BotFather](https://t.me/BotFather) on Telegram
   - Copy the `TELEGRAM_BOT_TOKEN` (looks like: `123456789:ABCdefGHIjklmnoPQRstuvWXYZ`)
   - Get your Telegram user ID:
     - Send `/start` to your bot
     - Bot will reply with your user ID
     - Copy it to `AUTHORIZED_USER_IDS`

   **ActualBudget:**
   - Find in Settings → Show advanced settings → Sync ID (copy the budget ID)
   - Note: The server password is your **sync password**, not your login password

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Fill in `.env` with your values:**
   ```env
   # Telegram Configuration
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   AUTHORIZED_USER_IDS=your_telegram_user_id

   # ActualBudget Configuration
   ACTUAL_SERVER_URL=http://actual:5006
   ACTUAL_SERVER_PASSWORD=your_sync_password
   BUDGET_ID=your_budget_id_from_settings
   # ACTUAL_E2E_PASSWORD=optional_if_using_encryption
   ```

5. **Verify configuration:**
   ```bash
   npm run test:setup
   ```
   This will:
   - ✓ Validate all configuration variables
   - ✓ Test connection to ActualBudget
   - ✓ Show sample data (uncategorized transactions, categories)

6. **Start the bot:**
   ```bash
   npm start
   ```

   You should see:
   ```
   ✓ ActualBudget API initialized successfully
   ✓ Bot commands registered
   🤖 Bot starting... waiting for messages
   ```

## Usage

### Test Commands (Verify Setup)

Once the bot is running, you can test it with:

```
/start          - Get your Telegram ID
/uncategorized  - See how many uncategorized transactions exist
/categories     - See how many categories are available
```

### Main Features (Coming in Phase 3)

- Receive notifications for uncategorized transactions
- Tap category button to categorize in Telegram
- Automatic 4-hour polling
- Track which transactions have been notified

## Configuration Reference

### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|----------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | [@BotFather](https://t.me/BotFather) → /newbot |
| `AUTHORIZED_USER_IDS` | Your Telegram ID (comma-separated for multiple) | Send `/start` to bot → ID in response |
| `ACTUAL_SERVER_URL` | URL where ActualBudget runs | Your ActualBudget instance URL |
| `ACTUAL_SERVER_PASSWORD` | Server sync password | ActualBudget Settings → Sync password |
| `BUDGET_ID` | Budget ID to monitor | ActualBudget Settings → Show advanced → Sync ID |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ACTUAL_E2E_PASSWORD` | End-to-end encryption password (if enabled) | Not set |

## Troubleshooting

### Configuration Errors

If you see configuration errors when running the bot:

```bash
npm run test:setup
```

This will show which variables are missing or invalid with examples.

### Common Issues

**"Cannot connect to ActualBudget server"**
- Check `ACTUAL_SERVER_URL` is correct (include http:// or https://)
- Verify ActualBudget is running and accessible at that URL
- Check network connectivity between bot and ActualBudget

**"Authentication failed"**
- Verify `ACTUAL_SERVER_PASSWORD` is your **sync password** (not login password)
- Check `BUDGET_ID` is correct (from Settings → Show advanced settings)
- If budget has encryption, set `ACTUAL_E2E_PASSWORD`

**"ReferenceError: navigator is not defined"**
- This is automatically fixed, but ensure you're using the latest version
- Run `npm run build` and `npm start`

**"Telegram bot not responding"**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Verify `AUTHORIZED_USER_IDS` contains your user ID
- Check bot is running: see "🤖 Bot starting..." message

## Development

### Scripts

```bash
npm run build        # Compile TypeScript
npm run dev          # Run with ts-node (development)
npm run test:setup   # Validate configuration and test connectivity
npm start            # Start bot (production)
```

### Project Structure

```
src/
├── index.ts                    # Bot entry point
├── middleware/
│   └── auth.ts                # Authorization middleware
├── services/
│   └── actual-api.ts          # ActualBudget API service
└── utils/
    └── config-validator.ts    # Configuration validation
```

### Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript
- **Bot Framework:** grammY (Telegram bot)
- **ActualBudget:** @actual-app/api (official client)
- **Environment:** dotenv for configuration

## Architecture Phases

The project is built in 4 phases:

1. ✅ **Phase 1: Authorization** - Secure access control
2. ✅ **Phase 2: Integration** - Connect to ActualBudget API
3. 🔄 **Phase 3: User Interface** - Categorization workflow
4. ⏳ **Phase 4: Automation** - Scheduled checks

Current status: **Phase 2 complete**, ready for Phase 3 UI development.

## Contributing

This is a personal project. Feel free to fork and modify for your needs!

## License

MIT

## Support

Check `.env.example` for all available configuration options with descriptions.

For ActualBudget help, see: https://actualbudget.com/

For Telegram bot setup, see: https://core.telegram.org/bots

---

**Last Updated:** 2026-03-12  
**Status:** Phase 2 Integration Complete
