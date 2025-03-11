import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export interface ProgressOptions {
  title: string;
  total?: number;
  unit?: string;
}

export class ProgressReporter {
  private current: number = 0;
  private readonly server: Server;
  private readonly token: string;
  private readonly total?: number;
  private readonly title: string;
  private readonly unit: string;

  constructor(server: Server, token: string, options: ProgressOptions) {
    this.server = server;
    this.token = token;
    this.total = options.total;
    this.title = options.title;
    this.unit = options.unit || 'items';
  }

  async report(increment: number = 1, message?: string): Promise<void> {
    this.current += increment;

    try {
      await this.server.notification({
        method: 'notifications/progress',
        params: {
          token: this.token,
          title: this.title,
          message: message || this.getDefaultMessage(),
          current: this.current,
          total: this.total,
          unit: this.unit
        }
      });
    } catch (error) {
      // Silently handle notification errors to not interrupt the main operation
      console.error('Failed to send progress notification:', error);
    }
  }

  private getDefaultMessage(): string {
    if (this.total) {
      const percentage = Math.round((this.current / this.total) * 100);
      return `Processing ${this.current}/${this.total} ${this.unit} (${percentage}%)`;
    }
    return `Processed ${this.current} ${this.unit}`;
  }

  async complete(message?: string): Promise<void> {
    try {
      await this.server.notification({
        method: 'notifications/progress/complete',
        params: {
          token: this.token,
          message: message || `Completed processing ${this.current} ${this.unit}`
        }
      });
    } catch (error) {
      console.error('Failed to send completion notification:', error);
    }
  }

  async error(error: Error): Promise<void> {
    try {
      await this.server.notification({
        method: 'notifications/progress/error',
        params: {
          token: this.token,
          error: error.message
        }
      });
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
  }
}

export async function withProgress<T>(
  server: Server,
  options: ProgressOptions,
  operation: (progress: ProgressReporter) => Promise<T>
): Promise<T> {
  const token = `progress-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const progress = new ProgressReporter(server, token, options);

  try {
    return await operation(progress);
  } catch (error) {
    await progress.error(error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}