/**
 * Gold Standard Logger for Verdantia.
 * En producción (Firebase/GCP), console.log/error estructurado como JSON 
 * es procesado automáticamente por Google Cloud Logging.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  message: string;
  context?: Record<string, any>;
  error?: unknown;
}

class Logger {
  private formatLog(level: LogLevel, payload: LogPayload) {
    const timestamp = new Date().toISOString();
    
    // En desarrollo local, lo mostramos bonito
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        info: '\x1b[36m', // Cyan
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        debug: '\x1b[90m', // Gray
      };
      const reset = '\x1b[0m';
      console[level](
        `${colors[level]}[${level.toUpperCase()}] ${timestamp} - ${payload.message}${reset}`,
        payload.context ? payload.context : '',
        payload.error ? payload.error : ''
      );
      return;
    }

    // En producción (GCP Logging espera JSON estructurado)
    const logEntry: any = {
      severity: level.toUpperCase(),
      timestamp,
      message: payload.message,
      context: payload.context,
    };

    if (payload.error) {
      logEntry.error_stack = payload.error instanceof Error ? payload.error.stack : String(payload.error);
    }

    console[level === 'error' ? 'error' : 'log'](JSON.stringify(logEntry));
  }

  info(message: string, context?: Record<string, any>) {
    this.formatLog('info', { message, context });
  }

  warn(message: string, context?: Record<string, any>) {
    this.formatLog('warn', { message, context });
  }

  error(message: string, error?: unknown, context?: Record<string, any>) {
    this.formatLog('error', { message, error, context });
  }

  debug(message: string, context?: Record<string, any>) {
    this.formatLog('debug', { message, context });
  }
}

export const logger = new Logger();
