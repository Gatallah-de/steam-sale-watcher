// Public API (same surface as the original module, plus timer controls)
export { notifyDiscordBatch } from './queue.js';
export { flushQueues, flushTarget, startNotifyTimer, stopNotifyTimer } from './timer.js';
export { computeDiscountPct, fmtMoney, compactLine, buildSingleEmbed } from './format.js';
export type { Target, NotifyOptions } from './types.js';
