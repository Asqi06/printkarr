/**
 * Demo-order store (localStorage-backed) exposed as an external store so
 * components can subscribe with useSyncExternalStore — no effects, no
 * hydration mismatches. Replaced by the real backend when ordering launches.
 */
export type DemoOrder = {
  id: string;
  placedAt: number;
  lineLabel: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryType: "express" | "karrRun";
  eta: string;
  zoneName: string;
  name: string;
  phone: string;
  address: string;
};

const KEY = "pk-demo-orders";
const EMPTY: DemoOrder[] = [];

let cache: DemoOrder[] | null = null;
const listeners = new Set<() => void>();

function fromStorage(): DemoOrder[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as DemoOrder[];
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function getDemoOrders(): DemoOrder[] {
  if (cache === null) cache = fromStorage();
  return cache;
}

/** Server snapshot: always empty — the client store hydrates itself. */
export function getDemoOrdersServerSnapshot(): DemoOrder[] {
  return EMPTY;
}

export function subscribeOrders(onChange: () => void): () => void {
  listeners.add(onChange);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners.delete(onChange);
    if (typeof window !== "undefined" && listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function handleStorage() {
  cache = null;
  notify();
}

function notify() {
  for (const l of listeners) l();
}

export function appendDemoOrder(order: DemoOrder): void {
  if (typeof window === "undefined") return;
  try {
    const all = [...getDemoOrders(), order].slice(-10);
    localStorage.setItem(KEY, JSON.stringify(all));
    cache = all;
    notify();
  } catch {
    /* storage unavailable — on-screen confirmation still works */
  }
}

export function findOrder(id: string): DemoOrder | null {
  const wanted = id.trim().toUpperCase().replace(/\s/g, "");
  if (!wanted) return null;
  return (
    getDemoOrders().find((o) => o.id.toUpperCase() === wanted) ?? null
  );
}
