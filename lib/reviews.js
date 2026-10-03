import { randomUUID } from 'node:crypto';

export function saveReview(db, user, input) {
  if (user?.role !== 'customer' || !db.users.some(u => u.id === user.id && u.role === 'customer')) throw new Error('Sign in as a customer to write a review.');
  const rating = Number(input.rating), text = String(input.text ?? '').trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Choose a rating from 1 to 5.');
  if (text.length < 10 || text.length > 1000) throw new Error('Write between 10 and 1,000 characters.');
  db.reviews ||= [];
  let review = db.reviews.find(r => r.customerId === user.id);
  if (!review) {
    review = { id: randomUUID(), customerId: user.id, createdAt: new Date().toISOString() };
    db.reviews.push(review);
  }
  Object.assign(review, { rating, text });
  return review;
}

export function deleteReview(db, user, id) {
  const index = (db.reviews || []).findIndex(r => r.id === id);
  if (index < 0) return false;
  if (user?.role !== 'admin' && !(user?.role === 'customer' && db.reviews[index].customerId === user.id)) throw new Error('You can only delete your own review.');
  db.reviews.splice(index, 1);
  return true;
}

export function publicReviews(db, user) {
  const customers = new Map(db.users.filter(u => u.role === 'customer').map(u => [u.id, u]));
  const printed = new Set(db.orders.filter(o => o.status === 'DELIVERED').map(o => o.customerId));
  return (db.reviews || []).filter(r => customers.has(r.customerId)).map(r => {
    const parts = String(customers.get(r.customerId).name || 'Customer').trim().split(/\s+/);
    return { id: r.id, text: r.text, rating: r.rating, createdAt: r.createdAt,
      name: parts[0] + (parts.length > 1 ? ' ' + parts.at(-1)[0] + '.' : ''),
      verified: printed.has(r.customerId), canDelete: user?.role === 'admin' || (user?.role === 'customer' && user.id === r.customerId) };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
