import { config } from "./config/app.config.js";

class Logger {
  private logLevel: string;

  constructor() {
    this.logLevel = config.server.logLevel;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: string): boolean {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    return (
      levels[level as keyof typeof levels] <=
      levels[this.logLevel as keyof typeof levels]
    );
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(`[${this.getTimestamp()}] ERROR: ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[${this.getTimestamp()}] WARN: ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.info(`[${this.getTimestamp()}] INFO: ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.debug(`[${this.getTimestamp()}] DEBUG: ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
