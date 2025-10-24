/**
 * Centralized logging utility for AISight
 * Only logs in development mode to avoid exposing sensitive data in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    // Check if running in development mode
    this.isDevelopment = __DEV__;
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log informational messages (only in development)
   */
  info(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warnings (visible in both dev and production)
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  /**
   * Log errors (visible in both dev and production)
   */
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  /**
   * Log with a specific level
   */
  log(level: LogLevel, message: string, ...args: any[]): void {
    switch (level) {
      case 'debug':
        this.debug(message, ...args);
        break;
      case 'info':
        this.info(message, ...args);
        break;
      case 'warn':
        this.warn(message, ...args);
        break;
      case 'error':
        this.error(message, ...args);
        break;
    }
  }
}

export const logger = new Logger();
