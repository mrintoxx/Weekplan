type LogContext = Record<string, unknown>;

const noop = () => undefined;

function makeLogger() {
  if (import.meta.env.DEV) {
    return {
      info: (message: string, context?: LogContext) => { console.info('[weekplan]', message, context ?? ''); },
      warn: (message: string, context?: LogContext) => { console.warn('[weekplan]', message, context ?? ''); },
      error: (message: string, context?: LogContext) => { console.error('[weekplan]', message, context ?? ''); },
    };
  }
  return { info: noop, warn: noop, error: noop };
}

export const logger = makeLogger();
