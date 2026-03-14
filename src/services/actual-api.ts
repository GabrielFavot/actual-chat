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
  payee?: string; // Alternative name used by API
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

export interface Payee {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  offbudget?: boolean;
}

export interface CategoryBudget {
  id: string;
  name: string;
  group_id: string;
  is_income: boolean;
  hidden: boolean;
  budgeted: number;   // integer, value × 100 (e.g. 50000 = $500.00)
  spent: number;      // integer, NEGATIVE for expenses
  balance: number;    // pre-calculated: budgeted + spent
  carryover?: boolean;
}

export interface CategoryGroupBudget {
  id: string;
  name: string;
  is_income: boolean;
  hidden: boolean;
  budgeted: number;
  spent: number;
  balance: number;
  categories: CategoryBudget[];
}

export interface BudgetMonth {
  month: string;
  totalBudgeted: number;
  totalSpent: number;
  totalBalance: number;
  toBudget: number;
  categoryGroups: CategoryGroupBudget[];
}

export class ActualApiService {
  private initialized = false;
  private config: ActualBudgetConfig;
  private payeesCache: Map<string, string> = new Map(); // Cache payee names
  private accountsCache: Map<string, Account> = new Map(); // Cache accounts

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
    const payeesMap = await this.getPayeesMap();
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
    const filtered = transactions.filter(t =>
      !t.category &&
      !t.transfer_id &&
      !t.starting_balance_flag
    );

    // Map to our Transaction interface and populate payee names
    return filtered.map((t: any) => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      payee_name: t.payee 
        ? payeesMap.get(t.payee) // Try to get name from cached payees
        : (t.imported_payee || 'Unknown'), // Fall back to imported_payee or Unknown
      category: t.category,
      account_id: t.account,
      transfer_id: t.transfer_id,
      starting_balance_flag: t.starting_balance_flag
    }));
  }

  async getCategories(): Promise<Category[]> {
    return actual.getCategories();
  }

  /**
   * Get category groups from the API
   * @returns Map of group_id to group name
   */
  async getCategoryGroups(): Promise<Map<string, string>> {
    try {
      const result = await (actual as any).getCategoryGroups();
      if (result && Array.isArray(result) && result.length > 0) {
        const groupMap = new Map<string, string>();
        result.forEach((group: any) => {
          if (group.id && group.name) {
            groupMap.set(group.id, group.name);
          }
        });
        return groupMap;
      }
      return new Map();
    } catch (error) {
      console.error('Error fetching category groups:', error);
      return new Map();
    }
  }

  /**
   * Get budget data for a specific month.
   * @param month - Month in "YYYY-MM" format (e.g. "2026-03")
   * @returns BudgetMonth with categoryGroups containing per-category balance data
   */
  async getBudgetMonth(month: string): Promise<BudgetMonth> {
    const data = await (actual as any).getBudgetMonth(month);
    return data as BudgetMonth;
  }

  /**
   * Get all payees (cached after first call)
   * @returns Map of payee ID to name
   */
  async getPayeesMap(): Promise<Map<string, string>> {
    if (this.payeesCache.size > 0) {
      return this.payeesCache; // Return cached payees
    }

    try {
      const payees = await actual.getPayees?.();
      if (Array.isArray(payees)) {
        payees.forEach((payee: any) => {
          this.payeesCache.set(payee.id, payee.name);
        });
      }
    } catch (error) {
      console.log('Could not fetch payees:', error);
    }

    return this.payeesCache;
  }

  /**
   * Get a single account by ID (cached after first call)
   * @param accountId - ID of the account to retrieve
   * @returns Account object with id and name
   * @throws Error if account not found
   */
  async getAccount(accountId: string): Promise<Account> {
    // Check cache first
    if (this.accountsCache.has(accountId)) {
      return this.accountsCache.get(accountId)!;
    }

    // Fetch all accounts if cache is empty
    const accounts = await actual.getAccounts();
    
    // Cache all accounts for future lookups
    accounts.forEach((acc: any) => {
      this.accountsCache.set(acc.id, {
        id: acc.id,
        name: acc.name,
        offbudget: acc.offbudget
      });
    });

    // Return the requested account
    const account = this.accountsCache.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    return account;
  }

  /**
   * Update a transaction's category.
   * Caller is responsible for passing a valid transactionId (already known from session).
   * @param transactionId - ID of transaction to update
   * @param categoryId - ID of category to assign
   * @throws Error if the API update fails
   */
  async updateTransaction(
    transactionId: string,
    categoryId: string
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('API not initialized');
    }

    await actual.updateTransaction(transactionId, { category: categoryId });
  }

  /**
   * Run bank account sync
   * Syncs transactions from connected bank accounts
   * @throws Error if sync fails
   */
  async syncBankAccounts(): Promise<void> {
    if (!this.initialized) {
      throw new Error('API not initialized');
    }
    
    try {
      console.log('Starting bank account sync...');
      await (actual as any).runBankSync?.();
      console.log('✓ Bank account sync completed');
    } catch (error) {
      console.error('Bank account sync failed:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    await actual.shutdown();
    this.initialized = false;
  }
}
