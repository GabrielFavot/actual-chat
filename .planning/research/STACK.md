# Technology Stack

**Project:** ActualBudget Telegram Bot
**Researched:** March 2025
**Overall Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 20.x LTS | Runtime environment | Required by @actual-app/api, excellent ecosystem for Telegram bots |
| TypeScript | 5.x | Language | Type safety for bot logic, context objects, and API responses |
| grammY | 1.x (latest) | Telegram bot framework | Supports Bot API 9.5 (latest as of March 2026), TypeScript-first design, excellent middleware system |
| dotenv | 16.x | Environment configuration | Manage secrets (Telegram token, Actual server credentials) |

### ActualBudget Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @actual-app/api | ^2.x | ActualBudget client | Official Node.js client, provides programmatic access to budget data |
| node-fetch | 3.x | HTTP client | Required by @actual-app/api for server communication |

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| better-sqlite3 | 11.x | Local SQLite bindings | Zero-configuration, embedded database perfect for single-instance bot, synchronous API matches bot workflow |
| Knex.js | 1.x | Query builder | Type-safe SQL queries, migration support, SQLite-native |

### Docker & Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js Alpine | 20-alpine | Base image | Minimal footprint, sufficient for production bot |
| Docker | Latest | Container runtime | Coolify deployment requirement |

### Development Tools

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ts-node | 10.x | TypeScript execution | Fast development iteration |
| ESLint | 9.x | Code linting | Maintain code quality |
| Prettier | 3.x | Code formatting | Consistent style |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Bot Framework | grammY | telegraf v4 | grammY has more current API support (9.5 vs 7.1), better TypeScript integration, more active maintenance |
| Bot Framework | grammY | node-telegram-bot-api | grammY provides middleware, sessions, and better plugin ecosystem out of the box |
| Database | better-sqlite3 | PostgreSQL + Prisma | PostgreSQL adds infrastructure complexity; bot is single-user/single-instance, no need for concurrent connections |
| Database | better-sqlite3 | In-memory only | Persistence needed for user preferences, category mappings, transaction state |

## Installation

```bash
# Core dependencies
npm install grammy dotenv

# ActualBudget integration
npm install @actual-app/api node-fetch@3

# Database
npm install better-sqlite3 knex

# Type definitions
npm install -D typescript @types/node ts-node
```

## Docker Configuration

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install better-sqlite3 native dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production

COPY . .

USER node

CMD ["node", "dist/index.js"]
```

## Environment Variables

```
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here
ACTUAL_SERVER_URL=http://actual:5006
ACTUAL_SERVER_PASSWORD=your_password
BUDGET_ID=your_budget_id

# Optional
NODE_ENV=production
LOG_LEVEL=info
```

## Sources

- grammY: https://grammy.dev/ (Supports Bot API 9.5, March 2026)
- @actual-app/api: https://actualbudget.org/docs/api/ (Official Actual Budget documentation)
- better-sqlite3: https://github.com/better-sqlite3/better-sqlite3 (Well-maintained SQLite bindings)
- Docker Node images: https://hub.docker.com/_/node (Official Node.js Docker images)

## Version Rationale

### Why grammY over telegraf

grammY is the most actively maintained Telegram bot framework with first-class support for the latest Bot API features. As of March 2026, grammY supports Bot API version 9.5 while telegraf v4 only supports 7.1. The grammY middleware system is more intuitive, session handling is built-in, and the TypeScript types are comprehensive. For a bot that needs to handle inline keyboards, callbacks, and user interactions, grammY provides better developer experience.

### Why better-sqlite3 over PostgreSQL

This bot is a single-instance application with one user (the Telegram user managing their budget). better-sqlite3 provides a zero-configuration embedded database that persists to a file, requires no separate service to run, and handles the bot's modest data storage needs (user preferences, category mappings, transaction state) efficiently. PostgreSQL would introduce infrastructure overhead (separate container, connection pooling) that provides no benefit for this use case.

### Why @actual-app/api

ActualBudget does not expose a traditional REST API. Instead, it provides the @actual-app/api npm package which acts as a client connecting to the sync server. This client contains all the business logic for querying and modifying budget data. The API provides methods like getBudgetMonth, addTransactions, and importTransactions that map directly to the operations needed for polling uncategorized transactions and syncing categories back.
