"use client";

import { useSyncExternalStore } from "react";
import { type PrintCartItem, type StationeryCartItem } from "./cartStore";
import { type UserAddress } from "./addressStore";

export type OrderStatus =
  | "RECEIVED"
  | "PRINTING"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type OrderRecord = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customer: {
    name: string;
    phone: string;
    address: string;
    area: string;
    pin: string;
    tag?: string;
  };
  prints: PrintCartItem[];
  stationery: StationeryCartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliverySlot: string;
  eta: string;
  rider: {
    name: string;
    phone: string;
    vehicle: string;
  };
  otp: string;
};

const STORAGE_KEY = "pk_orders_v2";

const SEED_ORDERS: OrderRecord[] = [
  {
    id: "PK-92841",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "OUT_FOR_DELIVERY",
    customer: {
      name: "Anirudh Verma",
      phone: "+91 90167 03180",
      address: "Flat 302, Royal Palms, Behind D-Mart",
      area: "Vapi",
      pin: "396191",
      tag: "Home",
    },
    prints: [
      {
        id: "print-seed-1",
        fileName: "Final_Year_Project_Report_v3.pdf",
        fileSize: 4200000,
        pages: 38,
        copies: 2,
        printType: "colour",
        sideType: "double",
        paperGrade: "100gsm",
        binding: "spiral",
        subtotal: 354,
      },
    ],
    stationery: [
      {
        item: {
          id: "prod-clear-folder",
          name: "A4 Transparent Document Folder",
          category: "files",
          price: 10,
          mrp: 15,
          unit: "1 piece",
          icon: "📁",
          description: "Clear poly folder",
          inStock: true,
        },
        quantity: 2,
      },
      {
        item: {
          id: "prod-ball-pen-blue",
          name: "Cello Gripper Ball Pen (Blue)",
          category: "pens",
          price: 10,
          mrp: 10,
          unit: "1 pen",
          icon: "🖊️",
          description: "Rubber grip pen",
          inStock: true,
        },
        quantity: 2,
      },
    ],
    subtotal: 394,
    deliveryFee: 0,
    discount: 15,
    total: 379,
    deliverySlot: "Express · 30-45 mins",
    eta: "Arriving in ~12 mins",
    rider: {
      name: "Ramesh Sharma",
      phone: "+91 98251 88392",
      vehicle: "TVS Jupiter (GJ-15-EM-7124)",
    },
    otp: "7314",
  },
  {
    id: "PK-92840",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: "PRINTING",
    customer: {
      name: "Pooja Patel",
      phone: "+91 97230 11492",
      address: "LIT Sarigam Campus, Girls Hostel Room 204",
      area: "Sarigam",
      pin: "396155",
      tag: "College",
    },
    prints: [
      {
        id: "print-seed-2",
        fileName: "Chemistry_Assignment_Unit4.pdf",
        fileSize: 1800000,
        pages: 12,
        copies: 1,
        printType: "bw",
        sideType: "single",
        paperGrade: "75gsm",
        binding: "staple",
        subtotal: 26,
      },
    ],
    stationery: [
      {
        item: {
          id: "prod-highlighter",
          name: "Neon Study Highlighter (Yellow)",
          category: "pens",
          price: 25,
          mrp: 35,
          unit: "1 piece",
          icon: "🖍️",
          description: "Chisel tip highlighter",
          inStock: true,
        },
        quantity: 1,
      },
    ],
    subtotal: 51,
    deliveryFee: 5,
    discount: 0,
    total: 56,
    deliverySlot: "Campus Gate Window",
    eta: "In printing desk queue",
    rider: {
      name: "Dinesh K",
      phone: "+91 94280 66310",
      vehicle: "Hero Splendor (GJ-15-AB-9921)",
    },
    otp: "5189",
  },
];

let cachedOrders: OrderRecord[] | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function loadOrders(): OrderRecord[] {
  if (typeof window === "undefined") return SEED_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ORDERS));
      return SEED_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ORDERS;
  } catch {
    return SEED_ORDERS;
  }
}

function persistOrders() {
  if (typeof window === "undefined" || !cachedOrders) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedOrders));
  } catch {
    // storage unavailable
  }
}

export function getOrders(): OrderRecord[] {
  if (cachedOrders === null) {
    cachedOrders = loadOrders();
  }
  return cachedOrders;
}

export function getOrderById(id: string): OrderRecord | undefined {
  const norm = id.trim().toUpperCase();
  return getOrders().find((o) => o.id.toUpperCase() === norm);
}

export function createOrder(data: {
  customer: UserAddress;
  prints: PrintCartItem[];
  stationery: StationeryCartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliverySlot: string;
}): OrderRecord {
  const id = `PK-${Math.floor(10000 + Math.random() * 90000)}`;
  const order: OrderRecord = {
    id,
    createdAt: new Date().toISOString(),
    status: "RECEIVED",
    customer: {
      name: data.customer.name,
      phone: data.customer.phone,
      address: data.customer.address,
      area: data.customer.area,
      pin: data.customer.pin,
      tag: data.customer.tag,
    },
    prints: data.prints,
    stationery: data.stationery,
    subtotal: data.subtotal,
    deliveryFee: data.deliveryFee,
    discount: data.discount,
    total: data.total,
    deliverySlot: data.deliverySlot,
    eta: "Arriving in 30-40 mins",
    rider: {
      name: "Rajesh Solanki",
      phone: "+91 98254 33182",
      vehicle: "Honda Activa 6G (GJ-15-CK-5512)",
    },
    otp: String(Math.floor(1000 + Math.random() * 9000)),
  };

  const list = [order, ...getOrders()];
  cachedOrders = list;
  persistOrders();
  notify();
  return order;
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const orders = getOrders();
  const updated = orders.map((o) => {
    if (o.id === orderId) {
      let eta = o.eta;
      if (status === "PRINTING") eta = "Printing in progress at dark store";
      else if (status === "PACKED") eta = "Packed and waiting for rider";
      else if (status === "OUT_FOR_DELIVERY") eta = "Rider on the way · Arriving in ~15 mins";
      else if (status === "DELIVERED") eta = "Delivered successfully";
      else if (status === "CANCELLED") eta = "Cancelled";
      return { ...o, status, eta };
    }
    return o;
  });
  cachedOrders = updated;
  persistOrders();
  notify();
}

export function subscribeOrders(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getServerOrdersSnapshot(): OrderRecord[] {
  return SEED_ORDERS;
}

export function useOrders() {
  const orders = useSyncExternalStore(
    subscribeOrders,
    getOrders,
    getServerOrdersSnapshot
  );
  return {
    orders,
    getOrderById,
    createOrder,
    updateOrderStatus,
  };
}
