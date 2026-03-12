import fs from 'fs';
import path from 'path';

/**
 * NotifierState: Track which transactions have been notified
 * 
 * Prevents re-notifying the same transaction across bot restarts.
 * Persists notification state to a JSON file.
 */
export class NotifierState {
  private notifiedTransactions: Map<string, number> = new Map();
  private statePath: string;

  constructor(statePath?: string) {
    this.statePath = statePath || '/tmp/actual-telegram-notif/notifier-state.json';
  }

  /**
   * Initialize: Load notification state from file on startup
   * Creates the directory if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.statePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Load existing state from file if it exists
      if (fs.existsSync(this.statePath)) {
        const data = fs.readFileSync(this.statePath, 'utf-8');
        const parsed = JSON.parse(data);
        
        if (parsed && typeof parsed === 'object') {
          // Reconstruct Map from object
          Object.entries(parsed).forEach(([txnId, timestamp]) => {
            this.notifiedTransactions.set(txnId, timestamp as number);
          });
        }

        console.log(`✓ Loaded ${this.notifiedTransactions.size} notified transactions from state`);
      } else {
        console.log('✓ Starting with fresh notification state');
      }
    } catch (error) {
      console.error('Error loading notification state:', error);
      // Continue with empty state rather than crashing
      this.notifiedTransactions.clear();
    }
  }

  /**
   * Check if a transaction has already been notified
   * @param transactionId - ID of the transaction
   * @returns true if transaction was previously notified
   */
  hasBeenNotified(transactionId: string): boolean {
    return this.notifiedTransactions.has(transactionId);
  }

  /**
   * Mark a transaction as notified
   * Updates the in-memory Map and persists to file
   * @param transactionId - ID of the transaction to mark
   */
  markNotified(transactionId: string): void {
    const timestamp = Date.now();
    this.notifiedTransactions.set(transactionId, timestamp);
    
    // Persist to file immediately
    this.save();
  }

  /**
   * Persist notification state to file
   * Converts Map to JSON object for storage
   */
  private save(): void {
    try {
      // Convert Map to plain object for JSON serialization
      const stateObject: Record<string, number> = {};
      this.notifiedTransactions.forEach((timestamp, txnId) => {
        stateObject[txnId] = timestamp;
      });

      // Ensure directory exists
      const dir = path.dirname(this.statePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write to file
      fs.writeFileSync(this.statePath, JSON.stringify(stateObject, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving notification state:', error);
      // Continue running - state loss is better than crashing the bot
    }
  }

  /**
   * Get count of notified transactions (for debugging)
   */
  getNotifiedCount(): number {
    return this.notifiedTransactions.size;
  }
}
