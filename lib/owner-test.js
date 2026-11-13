export function canUseOwnerTestPrint(user, order) {
  const sheets = Number(order?.pages) * Number(order?.copies);
  return user?.id === 'CUS-OWNER-TEST' && Number.isInteger(user.ownerTestPrintsLeft) && user.ownerTestPrintsLeft > 0
    && ['vapi', 'daman', 'sarigam', 'bhilad'].includes(order?.deliveryZone) && Number.isInteger(sheets) && sheets >= 1 && sheets <= 5;
}
