// In-app notifications — PRD §41. Every major state change notifies.
// Demo delivery = rows in db + rendered in profile. Later: WhatsApp/SMS/push.
import { loadDb, saveDb } from './db.js';

let seq = 0;

export function notify(customerId, orderId, text, at) {
  const db = loadDb();
  db.notifications ||= [];
  db.notifications.push({
    id: `NT-${Date.now()}-${seq++}`,
    customerId, orderId, text,
    at: at || new Date().toISOString(),
    read: false
  });
  saveDb(db);
}

export function notifyState(order) {
  const map = {
    CONFIRMED: `Order #${order.id} confirmed — payment received.`,
    PRINT_QUEUE: `Order #${order.id} is in the print queue.`,
    PRINTING: `Order #${order.id} has started printing.`,
    PRINTED: `Order #${order.id} has finished printing.`,
    READY_FOR_PICKUP: `Order #${order.id} is ready for pickup.`,
    RIDER_ASSIGNED: `Rider has been assigned to order #${order.id}.`,
    PICKED_UP: `Rider has picked up order #${order.id}.`,
    OUT_FOR_DELIVERY: `Order #${order.id} is out for delivery.`,
    DELIVERED: `Order #${order.id} was collected. Enjoy!`,
    CANCELLED: `Order #${order.id} was cancelled.`
  };
  const text = map[order.status];
  if (text) notify(order.customerId, order.id, text);
}
