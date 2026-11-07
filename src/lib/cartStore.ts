"use client";

import { useSyncExternalStore } from "react";
import { type StationeryItem, STATIONERY_CATALOGUE } from "./stationeryData";

export type PrintCartItem = {
  id: string;
  fileName: string;
  fileSize: number;
  pages: number;
  copies: number;
  printType: "bw" | "colour";
  sideType: "single" | "double";
  paperGrade: "75gsm" | "100gsm";
  binding: "none" | "staple" | "spiral" | "wiro" | "hardcover";
  range?: string;
  notes?: string;
  subtotal: number;
};

export type StationeryCartItem = {
  item: StationeryItem;
  quantity: number;
};

export type DeliverySlot = "express" | "campus" | "evening";

export type CartState = {
  prints: PrintCartItem[];
  stationery: StationeryCartItem[];
  deliverySlot: DeliverySlot;
  couponCode: string | null;
  couponDiscount: number;
  isOpen: boolean;
};

const STORAGE_KEY = "pk_cart_v2";
export const FREE_DELIVERY_THRESHOLD = 149;

const INITIAL_STATE: CartState = {
  prints: [],
  stationery: [],
  deliverySlot: "express",
  couponCode: null,
  couponDiscount: 0,
  isOpen: false,
};

let cachedState: CartState | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function loadState(): CartState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    return {
      prints: Array.isArray(parsed.prints) ? parsed.prints : [],
      stationery: Array.isArray(parsed.stationery) ? parsed.stationery : [],
      deliverySlot: parsed.deliverySlot || "express",
      couponCode: parsed.couponCode || null,
      couponDiscount: Number(parsed.couponDiscount) || 0,
      isOpen: false,
    };
  } catch {
    return INITIAL_STATE;
  }
}

function persistState() {
  if (typeof window === "undefined" || !cachedState) return;
  try {
    const toSave = {
      prints: cachedState.prints,
      stationery: cachedState.stationery,
      deliverySlot: cachedState.deliverySlot,
      couponCode: cachedState.couponCode,
      couponDiscount: cachedState.couponDiscount,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // quota exceeded or private mode
  }
}

export function getCartState(): CartState {
  if (cachedState === null) {
    cachedState = loadState();
  }
  return cachedState;
}

export function openCart() {
  const s = getCartState();
  cachedState = { ...s, isOpen: true };
  notify();
}

export function closeCart() {
  const s = getCartState();
  cachedState = { ...s, isOpen: false };
  notify();
}

export function addStationery(item: StationeryItem, quantity = 1) {
  const s = getCartState();
  const existingIndex = s.stationery.findIndex((x) => x.item.id === item.id);
  let updated: StationeryCartItem[];
  if (existingIndex >= 0) {
    updated = s.stationery.map((x, i) =>
      i === existingIndex ? { ...x, quantity: x.quantity + quantity } : x
    );
  } else {
    updated = [...s.stationery, { item, quantity }];
  }
  cachedState = { ...s, stationery: updated };
  recalcDiscount();
  persistState();
  notify();
}

export function updateStationeryQuantity(itemId: string, quantity: number) {
  const s = getCartState();
  let updated: StationeryCartItem[];
  if (quantity <= 0) {
    updated = s.stationery.filter((x) => x.item.id !== itemId);
  } else {
    updated = s.stationery.map((x) =>
      x.item.id === itemId ? { ...x, quantity } : x
    );
  }
  cachedState = { ...s, stationery: updated };
  recalcDiscount();
  persistState();
  notify();
}

export function removeStationery(itemId: string) {
  updateStationeryQuantity(itemId, 0);
}

export function addPrint(print: PrintCartItem) {
  const s = getCartState();
  cachedState = { ...s, prints: [...s.prints, print] };
  recalcDiscount();
  persistState();
  notify();
}

export function addMultiplePrints(prints: PrintCartItem[]) {
  const s = getCartState();
  cachedState = { ...s, prints: [...s.prints, ...prints] };
  recalcDiscount();
  persistState();
  notify();
}

export function removePrint(id: string) {
  const s = getCartState();
  cachedState = { ...s, prints: s.prints.filter((p) => p.id !== id) };
  recalcDiscount();
  persistState();
  notify();
}

export function setDeliverySlot(slot: DeliverySlot) {
  const s = getCartState();
  cachedState = { ...s, deliverySlot: slot };
  persistState();
  notify();
}

export function applyCoupon(code: string): { success: boolean; message: string } {
  const s = getCartState();
  const trimmed = code.trim().toUpperCase();
  const subtotal = calculateSubtotal(s);

  if (trimmed === "WELCOME10") {
    const discount = Math.min(50, Math.round(subtotal * 0.1));
    cachedState = { ...s, couponCode: trimmed, couponDiscount: discount };
    persistState();
    notify();
    return { success: true, message: `Code applied! Saved ₹${discount}` };
  }
  if (trimmed === "STUDENT5") {
    const discount = 5;
    cachedState = { ...s, couponCode: trimmed, couponDiscount: discount };
    persistState();
    notify();
    return { success: true, message: `Student voucher applied! Saved ₹5` };
  }
  if (trimmed === "PRINTKARR" && subtotal >= 100) {
    const discount = 15;
    cachedState = { ...s, couponCode: trimmed, couponDiscount: discount };
    persistState();
    notify();
    return { success: true, message: `PrintKarr super voucher applied! Saved ₹15` };
  }
  return { success: false, message: "Invalid or expired coupon code." };
}

export function removeCoupon() {
  const s = getCartState();
  cachedState = { ...s, couponCode: null, couponDiscount: 0 };
  persistState();
  notify();
}

export function clearCart() {
  cachedState = { ...INITIAL_STATE, stationery: [], prints: [] };
  persistState();
  notify();
}

function calculateSubtotal(s: CartState): number {
  const printTotal = s.prints.reduce((acc, p) => acc + p.subtotal, 0);
  const stationeryTotal = s.stationery.reduce(
    (acc, item) => acc + item.item.price * item.quantity,
    0
  );
  return printTotal + stationeryTotal;
}

function recalcDiscount() {
  if (!cachedState?.couponCode) return;
  const sub = calculateSubtotal(cachedState);
  if (cachedState.couponCode === "WELCOME10") {
    cachedState.couponDiscount = Math.min(50, Math.round(sub * 0.1));
  } else if (cachedState.couponCode === "STUDENT5") {
    cachedState.couponDiscount = 5;
  } else if (cachedState.couponCode === "PRINTKARR") {
    cachedState.couponDiscount = sub >= 100 ? 15 : 0;
  }
}

export function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getServerSnapshot(): CartState {
  return INITIAL_STATE;
}

export function useCart() {
  const state = useSyncExternalStore(
    subscribeCart,
    getCartState,
    getServerSnapshot
  );

  const printTotal = state.prints.reduce((acc, p) => acc + p.subtotal, 0);
  const stationeryTotal = state.stationery.reduce(
    (acc, item) => acc + item.item.price * item.quantity,
    0
  );
  const subtotal = printTotal + stationeryTotal;

  // Delivery fee logic: ₹20 standard, ₹5 campus, or FREE on >= ₹149
  let deliveryFee = 0;
  if (subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD) {
    if (state.deliverySlot === "campus") deliveryFee = 5;
    else if (state.deliverySlot === "express") deliveryFee = 20;
    else deliveryFee = 0; // evening free
  }

  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD && subtotal > 0;
  const total = Math.max(0, subtotal + deliveryFee - state.couponDiscount);
  const totalCount =
    state.prints.length +
    state.stationery.reduce((acc, x) => acc + x.quantity, 0);

  return {
    ...state,
    totalCount,
    printTotal,
    stationeryTotal,
    subtotal,
    deliveryFee,
    freeDeliveryRemaining,
    isFreeDelivery,
    total,
    openCart,
    closeCart,
    addStationery,
    updateStationeryQuantity,
    removeStationery,
    addPrint,
    addMultiplePrints,
    removePrint,
    setDeliverySlot,
    applyCoupon,
    removeCoupon,
    clearCart,
  };
}
