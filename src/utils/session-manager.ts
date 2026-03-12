import { Transaction } from '../services/actual-api.js';

/**
 * Simple in-memory session manager for storing transaction context
 * Maps short IDs to transaction objects for callback handling
 */
class SessionManager {
  private sessions: Map<string, Transaction> = new Map();
  private sessionTimeout = 15 * 60 * 1000; // 15 minutes
  private sessionTimers: Map<string, NodeJS.Timeout> = new Map();
  private counter = 0;

  /**
   * Store a transaction and return a short ID for callback_data
   * @param transaction - Transaction to store
   * @returns Short session ID
   */
  storeTransaction(transaction: Transaction): string {
    const sessionId = `txn_${++this.counter}`;
    this.sessions.set(sessionId, transaction);

    // Auto-cleanup after 15 minutes
    const timer = setTimeout(() => {
      this.sessions.delete(sessionId);
      this.sessionTimers.delete(sessionId);
    }, this.sessionTimeout);

    this.sessionTimers.set(sessionId, timer);

    return sessionId;
  }

  /**
   * Retrieve a transaction by session ID
   * @param sessionId - Session ID from callback_data
   * @returns Transaction or undefined if expired/not found
   */
  getTransaction(sessionId: string): Transaction | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Clear a session (usually after it's been used)
   * @param sessionId - Session ID to clear
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    const timer = this.sessionTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.sessionTimers.delete(sessionId);
    }
  }

  /**
   * Get all active sessions (for debugging)
   */
  getSessions(): number {
    return this.sessions.size;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
