// Printkarr order state machine — PRD §38.
// Single source of truth for every status change. UI and API may only
// move an order throughcanTransition(); transition() stamps history.

export const STATES = [
  'CREATED',
  'PAYMENT_PENDING',
  'CONFIRMED',
  'PRINT_QUEUE',
  'PRINTING',
  'PRINTED',
  'READY_FOR_PICKUP',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'PAYMENT_FAILED',
  'PRINT_FAILED',
  'DELIVERY_FAILED',
  'REFUNDED'
];

export const TERMINAL = ['DELIVERED', 'REFUNDED'];

const T = {
  CREATED: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED'],
  CONFIRMED: ['PRINT_QUEUE', 'CANCELLED'],
  PRINT_QUEUE: ['PRINTING', 'CANCELLED'],
  PRINTING: ['PRINTED', 'PRINT_FAILED'],
  PRINTED: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['RIDER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'],
  RIDER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERED: [],
  CANCELLED: ['REFUNDED'],
  PAYMENT_FAILED: ['PAYMENT_PENDING', 'REFUNDED'],
  PRINT_FAILED: ['PRINT_QUEUE', 'REFUNDED'],
  DELIVERY_FAILED: ['RIDER_ASSIGNED', 'REFUNDED'],
  REFUNDED: []
};

export const TRANSITIONS = T;

export function canTransition(from, to) {
  if (!STATES.includes(from) || !STATES.includes(to)) return false;
  return (T[from] || []).includes(to);
}

export function nextStates(from) {
  return [...(T[from] || [])];
}

export function isTerminal(status) {
  return TERMINAL.includes(status);
}

// Mutates `order`: sets status, updatedAt, appends {from,to,at,by,note}.
// Throws on illegal transition — callers must handle (400 to client).
export function transition(order, to, opts = {}) {
  const from = order.status;
  if (!canTransition(from, to)) {
    throw new Error(`Illegal transition ${from} → ${to}`);
  }
  const at = opts.at || new Date().toISOString();
  order.status = to;
  order.updatedAt = at;
  order.history ||= [];
  order.history.push({ from, to, at, by: opts.by || null, note: opts.note || null });
  return order;
}
