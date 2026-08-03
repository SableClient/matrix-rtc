export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogSink = (
  namespace: string,
  level: LogLevel,
  category: string,
  message: string,
  data?: unknown
) => void;

export type DebugLogger = {
  debug: (category: string, message: string, data?: unknown) => void;
  info: (category: string, message: string, data?: unknown) => void;
  warn: (category: string, message: string, data?: unknown) => void;
  error: (category: string, message: string, data?: unknown) => void;
};

let sink: LogSink | undefined;

/** Nothing is emitted until a host installs a sink. */
export const setLogSink = (next: LogSink | undefined): void => {
  sink = next;
};

export const createDebugLogger = (namespace: string): DebugLogger => ({
  debug: (category, message, data) => sink?.(namespace, 'debug', category, message, data),
  info: (category, message, data) => sink?.(namespace, 'info', category, message, data),
  warn: (category, message, data) => sink?.(namespace, 'warn', category, message, data),
  error: (category, message, data) => sink?.(namespace, 'error', category, message, data),
});
