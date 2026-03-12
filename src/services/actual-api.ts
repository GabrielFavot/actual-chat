import actual from '@actual-app/api';
import fs from 'fs';
import path from 'path';

interface ActualBudgetConfig {
  serverUrl: string;
  password: string;
  budgetId: string;
  e2ePassword?: string;
  dataDir?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  payee_name?: string;
  category?: string | null;
  account_id: string;
  transfer_id?: string;
  starting_balance_flag?: boolean;
}

export interface Category {
  id: string;
  name: string;
  group_id?: string;
}

export class ActualApiService {
  private initialized = false;
  private config: ActualBudgetConfig;

  constructor(config: ActualBudgetConfig) {
    this.config = {
      dataDir: '/tmp/actual-telegram-notif/',
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure data directory exists
    const dataDir = this.config.dataDir || '/tmp/actual-telegram-notif/';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    await actual.init({
      dataDir,
      serverURL: this.config.serverUrl,
      password: this.config.password,
    });

    const downloadOptions = this.config.e2ePassword
      ? { password: this.config.e2ePassword }
      : {};

    await actual.downloadBudget(this.config.budgetId, downloadOptions);
    this.initialized = true;
    console.log('ActualBudget API initialized successfully');
  }

  async getUncategorizedTransactions(): Promise<Transaction[]> {
    const accounts = await actual.getAccounts();
    let transactions: any[] = [];

    for (const account of accounts) {
      // Skip off-budget accounts
      if (account.offbudget) continue;

      const accountTransactions = await actual.getTransactions(
        account.id,
        '1990-01-01',
        '2030-01-01'
      );
      transactions = transactions.concat(accountTransactions);
    }

    // Filter: no category, not transfer, not starting balance
    return transactions.filter(t =>
      !t.category &&
      !t.transfer_id &&
      !t.starting_balance_flag
    );
  }

  async getCategories(): Promise<Category[]> {
    return actual.getCategories();
  }

  async shutdown(): Promise<void> {
    await actual.shutdown();
    this.initialized = false;
  }
}
