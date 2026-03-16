/**
 * Configuration validator with clear error messages
 * Guides users to fix missing or invalid configuration
 */

interface ConfigError {
  variable: string;
  missing: boolean;
  value?: string;
  error?: string;
  help: string;
  example: string;
}

export class ConfigValidator {
  /**
   * Validate Telegram configuration
   */
  validateTelegram(): ConfigError[] {
    const errors: ConfigError[] = [];

    // TELEGRAM_BOT_TOKEN
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      errors.push({
        variable: 'TELEGRAM_BOT_TOKEN',
        missing: true,
        help: 'Create a new bot with @BotFather on Telegram',
        example: 'TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvWXYZ',
      });
    }

    // TELEGRAM_USER_ID
    if (!process.env.TELEGRAM_USER_ID) {
      errors.push({
        variable: 'TELEGRAM_USER_ID',
        missing: true,
        help: 'Your Telegram user ID (get it by sending /start to your bot)',
        example: 'TELEGRAM_USER_ID=987654321',
      });
    } else if (!/^\d+$/.test(process.env.TELEGRAM_USER_ID.trim())) {
      errors.push({
        variable: 'TELEGRAM_USER_ID',
        missing: false,
        value: process.env.TELEGRAM_USER_ID,
        error: 'Invalid format - must be a single numeric ID',
        help: 'Use your numeric Telegram user ID only',
        example: 'TELEGRAM_USER_ID=987654321',
      });
    }

    return errors;
  }

  /**
   * Validate ActualBudget configuration
   */
  validateActualBudget(): ConfigError[] {
    const errors: ConfigError[] = [];

    // ACTUAL_SERVER_URL
    if (!process.env.ACTUAL_SERVER_URL) {
      errors.push({
        variable: 'ACTUAL_SERVER_URL',
        missing: true,
        help: 'URL where your ActualBudget instance is running',
        example: 'ACTUAL_SERVER_URL=http://actual:5006 or https://budget.example.com',
      });
    } else if (!/^https?:\/\//.test(process.env.ACTUAL_SERVER_URL)) {
      errors.push({
        variable: 'ACTUAL_SERVER_URL',
        missing: false,
        value: process.env.ACTUAL_SERVER_URL,
        error: 'Invalid format - must start with http:// or https://',
        help: 'Include the protocol (http or https)',
        example: 'ACTUAL_SERVER_URL=http://actual:5006',
      });
    }

    // ACTUAL_SERVER_PASSWORD
    if (!process.env.ACTUAL_SERVER_PASSWORD) {
      errors.push({
        variable: 'ACTUAL_SERVER_PASSWORD',
        missing: true,
        help: 'Your ActualBudget server sync password',
        example: 'ACTUAL_SERVER_PASSWORD=your_server_password',
      });
    }

    // BUDGET_ID
    if (!process.env.BUDGET_ID) {
      errors.push({
        variable: 'BUDGET_ID',
        missing: true,
        help: 'Find in ActualBudget Settings → Show advanced settings → Sync ID (copy the budget ID)',
        example: 'BUDGET_ID=550e8400-e29b-41d4-a716-446655440000',
      });
    } else if (!/^[a-f0-9\-]{36}$/.test(process.env.BUDGET_ID)) {
      // UUID format check
      errors.push({
        variable: 'BUDGET_ID',
        missing: false,
        value: process.env.BUDGET_ID,
        error: 'Invalid format - must be a UUID (36 characters with hyphens)',
        help: 'Copy from ActualBudget Settings → Show advanced settings → Sync ID',
        example: 'BUDGET_ID=550e8400-e29b-41d4-a716-446655440000',
      });
    }

    // ACTUAL_E2E_PASSWORD (optional, but validate format if present)
    if (process.env.ACTUAL_E2E_PASSWORD && !process.env.ACTUAL_E2E_PASSWORD.trim()) {
      errors.push({
        variable: 'ACTUAL_E2E_PASSWORD',
        missing: false,
        value: process.env.ACTUAL_E2E_PASSWORD,
        error: 'Empty value - remove from .env if not using encryption',
        help: 'Only required if your budget has end-to-end encryption',
        example: 'ACTUAL_E2E_PASSWORD=your_e2e_password or leave unset',
      });
    }

    return errors;
  }

  /**
   * Validate currency configuration
   */
  validateCurrency(): ConfigError[] {
    const errors: ConfigError[] = [];

    // CURRENCY is optional — validate ISO 4217 format (3 uppercase letters) if provided
    if (process.env.CURRENCY && !/^[A-Z]{3}$/.test(process.env.CURRENCY)) {
      errors.push({
        variable: 'CURRENCY',
        missing: false,
        value: process.env.CURRENCY,
        error: 'Invalid currency code - must be a 3-letter ISO 4217 code (e.g. USD, EUR, GBP)',
        help: 'Use a standard 3-letter uppercase currency code',
        example: 'CURRENCY=EUR',
      });
    }

    return errors;
  }

  /**
   * Validate transaction lookback configuration
   */
  validateTransactionLookback(): ConfigError[] {
    const errors: ConfigError[] = [];

    // TRANSACTION_LOOKBACK_MONTHS is optional — validate positive integer if provided
    if (process.env.TRANSACTION_LOOKBACK_MONTHS !== undefined) {
      const val = parseInt(process.env.TRANSACTION_LOOKBACK_MONTHS, 10);
      if (isNaN(val) || val <= 0 || String(val) !== process.env.TRANSACTION_LOOKBACK_MONTHS.trim()) {
        errors.push({
          variable: 'TRANSACTION_LOOKBACK_MONTHS',
          missing: false,
          value: process.env.TRANSACTION_LOOKBACK_MONTHS,
          error: 'Invalid value - must be a positive integer (number of months)',
          help: 'Limits how far back uncategorized transactions are fetched. Default is 3.',
          example: 'TRANSACTION_LOOKBACK_MONTHS=3',
        });
      }
    }

    return errors;
  }

  /**
   * Validate all configuration
   */
  validateAll(): ConfigError[] {
    return [
      ...this.validateTelegram(),
      ...this.validateActualBudget(),
      ...this.validateCurrency(),
      ...this.validateTransactionLookback(),
    ];
  }

  /**
   * Format errors for display
   */
  static formatErrors(errors: ConfigError[]): string {
    if (errors.length === 0) return '';

    const lines: string[] = [];
    lines.push('\n❌ Configuration Issues Found\n');
    lines.push('═'.repeat(60));

    errors.forEach((err, idx) => {
      lines.push(`\n[${idx + 1}] ${err.variable}`);
      lines.push('─'.repeat(40));

      if (err.missing) {
        lines.push(`Status: MISSING (required)`);
      } else {
        lines.push(`Status: INVALID`);
        lines.push(`Value: "${err.value}"`);
        if (err.error) {
          lines.push(`Error: ${err.error}`);
        }
      }

      if (err.help) {
        lines.push(`Help: ${err.help}`);
      }
      lines.push(`Example: ${err.example}`);
    });

    lines.push('\n' + '═'.repeat(60));
    lines.push('\nSetup Instructions:');
    lines.push('1. Create/edit .env file in project root');
    lines.push('2. Add all missing variables');
    lines.push('3. Run: npm start\n');

    return lines.join('\n');
  }

  /**
   * Throw error if validation fails
   */
  static validateAndExit(): void {
    const validator = new ConfigValidator();
    const errors = validator.validateAll();

    if (errors.length > 0) {
      console.error(ConfigValidator.formatErrors(errors));
      process.exit(1);
    }
  }
}
