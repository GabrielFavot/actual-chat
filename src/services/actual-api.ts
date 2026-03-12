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

export class ActualApiService {
  private initialized = false;
  private config: ActualBudgetConfig;
  private payeesCache: Map<string, string> = new Map(); // Cache payee names

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
   * Get categories grouped by their group_id
   * Returns the full hierarchy structure
   */
  async getCategoriesGrouped(): Promise<any> {
    return (actual as any).getCategoriesGrouped?.();
  }

  /**
   * Get category groups from the API
   * @returns Map of group_id to group name
   */
  async getCategoryGroups(): Promise<Map<string, string>> {
    try {
      console.log('🔍 Attempting to fetch category groups...');
      
      // Log what's available on actual object
      console.log('Methods on actual:', Object.keys(actual as any)
        .filter(k => typeof (actual as any)[k] === 'function')
        .filter(k => k.toLowerCase().includes('group') || k.toLowerCase().includes('categor'))
        .slice(0, 20)
      );

      // Try getCategoryGroups if it exists
      if (typeof (actual as any).getCategoryGroups === 'function') {
        console.log('✅ Found getCategoryGroups method');
        const result = await (actual as any).getCategoryGroups();
        if (result && Array.isArray(result) && result.length > 0) {
          const groupMap = new Map<string, string>();
          result.forEach((group: any) => {
            if (group.id && group.name) {
              groupMap.set(group.id, group.name);
            }
          });
          if (groupMap.size > 0) {
            console.log(`Found ${groupMap.size} category groups`);
            return groupMap;
          }
        }
      }

      // Try getCategoriesGrouped
      if (typeof (actual as any).getCategoriesGrouped === 'function') {
        console.log('✅ Found getCategoriesGrouped method');
        const result = await (actual as any).getCategoriesGrouped();
        console.log('getCategoriesGrouped result:', typeof result, Array.isArray(result) ? `[${result.length}]` : '');
        
        if (result && Array.isArray(result) && result.length > 0) {
          const groupMap = new Map<string, string>();
          result.forEach((group: any) => {
            if (group.id && group.name) {
              groupMap.set(group.id, group.name);
            }
          });
          if (groupMap.size > 0) {
            console.log(`Found ${groupMap.size} groups via getCategoriesGrouped`);
            return groupMap;
          }
        }
      }

      // Try q() query builder if available
      if (typeof (actual as any).q === 'function') {
        console.log('✅ Found q() query builder');
        try {
          const result = await (actual as any).q('categorygroups').select('*');
          console.log('q() categorygroups result:', typeof result);
          if (result && Array.isArray(result)) {
            const groupMap = new Map<string, string>();
            result.forEach((group: any) => {
              if (group.id && group.name) {
                groupMap.set(group.id, group.name);
              }
            });
            if (groupMap.size > 0) {
              console.log(`Found ${groupMap.size} groups via q()`);
              return groupMap;
            }
          }
        } catch (e) {
          console.log('q() failed:', (e as Error).message.slice(0, 50));
        }
      }

      console.log('❌ Could not find method to fetch category groups');
      return new Map();
    } catch (error) {
      console.log('Error fetching category groups:', error);
      return new Map();
    }
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
   * Update a transaction's category
   * @param transactionId - ID of transaction to update
   * @param categoryId - ID of category to assign
   * @returns Updated transaction object
   * @throws Error if transaction or category not found
   */
  async updateTransaction(
    transactionId: string,
    categoryId: string
  ): Promise<Transaction> {
    if (!this.initialized) {
      throw new Error('API not initialized');
    }

    // Verify category exists
    const categories = await this.getCategories();
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    // Get all transactions to find the one we're updating
    const accounts = await actual.getAccounts();
    let targetTransaction: any = null;

    for (const account of accounts) {
      if (account.offbudget) continue;

      const accountTransactions = await actual.getTransactions(
        account.id,
        '1990-01-01',
        '2030-01-01'
      );

      const found = accountTransactions.find((t: any) => t.id === transactionId);
      if (found) {
        targetTransaction = found;
        break;
      }
    }

    if (!targetTransaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    // Update the transaction with new category
    await actual.updateTransaction(transactionId, {
      category: categoryId
    });

    // Return updated transaction
    return {
      id: targetTransaction.id,
      date: targetTransaction.date,
      amount: targetTransaction.amount,
      payee_name: targetTransaction.payee || targetTransaction.payee_name,
      category: categoryId,
      account_id: targetTransaction.account_id,
      transfer_id: targetTransaction.transfer_id,
      starting_balance_flag: targetTransaction.starting_balance_flag
    };
  }

  async shutdown(): Promise<void> {
    await actual.shutdown();
    this.initialized = false;
  }
}
