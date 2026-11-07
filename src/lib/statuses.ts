const STATUSES = [
  "RECEIVED",
  "CONFIRMED",
  "PRINTING",
  "QUALITY CHECK",
  "PACKED",
  "ON THE WAY",
  "DELIVERED",
] as const;

export type Status = (typeof STATUSES)[number];

export const stepIcon = (i: number) => ({
  RECEIVED: "✉",
  CONFIRMED: "✓",
  PRINTING: "▤",
  "QUALITY CHECK": "◎",
  PACKED: "▣",
  "ON THE WAY": "➤",
  DELIVERED: "★",
}[STATUSES[i]] ?? "•");

export default STATUSES;
