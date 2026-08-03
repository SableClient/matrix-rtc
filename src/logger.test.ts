import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDebugLogger, setLogSink, type LogSink } from './logger.js';

afterEach(() => {
  setLogSink(undefined);
});

describe('createDebugLogger', () => {
  it('emits nothing until a host installs a sink', () => {
    const log = createDebugLogger('example');

    expect(() => log.info('call', 'no sink installed')).not.toThrow();
  });

  it('passes the namespace, level, category, message and data through', () => {
    const sink = vi.fn<LogSink>();
    setLogSink(sink);

    createDebugLogger('example').warn('call', 'token refused', { status: 401 });

    expect(sink).toHaveBeenCalledWith('example', 'warn', 'call', 'token refused', {
      status: 401,
    });
  });

  it('routes every level', () => {
    const sink = vi.fn<LogSink>();
    setLogSink(sink);
    const log = createDebugLogger('example');

    log.debug('call', 'd');
    log.info('call', 'i');
    log.warn('call', 'w');
    log.error('call', 'e');

    expect(sink.mock.calls.map((call) => call[1])).toEqual(['debug', 'info', 'warn', 'error']);
  });

  it('stops emitting once the sink is removed', () => {
    const sink = vi.fn<LogSink>();
    setLogSink(sink);
    const log = createDebugLogger('example');

    setLogSink(undefined);
    log.info('call', 'dropped');

    expect(sink).not.toHaveBeenCalled();
  });
});
