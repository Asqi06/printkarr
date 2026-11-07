"use client";

import { useSyncExternalStore } from "react";

export type UserAddress = {
  id: string;
  name: string;
  phone: string;
  tag: "Home" | "College" | "Work" | "Other";
  address: string;
  area: "Vapi" | "Sarigam" | "Daman" | "Bhilad";
  locality: string;
  pin: string;
  landmark?: string;
  isDefault?: boolean;
};

const STORAGE_KEY = "pk_addresses_v2";
const ACTIVE_KEY = "pk_active_address_id";

const DEFAULT_ADDRESSES: UserAddress[] = [
  {
    id: "addr-home-vapi",
    name: "Anirudh Verma",
    phone: "+91 90167 03180",
    tag: "Home",
    address: "Flat 302, Royal Palms, Behind D-Mart",
    area: "Vapi",
    locality: "Chala",
    pin: "396191",
    landmark: "Near Galaxy High School",
    isDefault: true,
  },
  {
    id: "addr-college-sarigam",
    name: "Anirudh Verma",
    phone: "+91 90167 03180",
    tag: "College",
    address: "Laxmi Institute of Technology (LIT), Main Gate",
    area: "Sarigam",
    locality: "Laxmi Vidyapeeth Campus",
    pin: "396155",
    landmark: "Security Desk / Student Delivery Point",
    isDefault: false,
  },
  {
    id: "addr-work-gunjan",
    name: "Anirudh Verma",
    phone: "+91 90167 03180",
    tag: "Work",
    address: "Plot 42, GIDC Phase 1, Near Station Road",
    area: "Vapi",
    locality: "Gunjan",
    pin: "396195",
    landmark: "Opposite Bank of Baroda",
    isDefault: false,
  },
];

let cachedAddresses: UserAddress[] | null = null;
let cachedActiveId: string | null = null;
let isDrawerOpen = false;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function loadFromStorage(): UserAddress[] {
  if (typeof window === "undefined") return DEFAULT_ADDRESSES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ADDRESSES));
      return DEFAULT_ADDRESSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ADDRESSES;
  } catch {
    return DEFAULT_ADDRESSES;
  }
}

function loadActiveId(addresses: UserAddress[]): string {
  if (typeof window === "undefined") return addresses[0]?.id || "";
  try {
    const stored = localStorage.getItem(ACTIVE_KEY);
    if (stored && addresses.some((a) => a.id === stored)) return stored;
    const def = addresses.find((a) => a.isDefault) || addresses[0];
    return def?.id || "";
  } catch {
    return addresses[0]?.id || "";
  }
}

export function getAddresses(): UserAddress[] {
  if (cachedAddresses === null) {
    cachedAddresses = loadFromStorage();
  }
  return cachedAddresses;
}

export function getActiveAddress(): UserAddress {
  const addrs = getAddresses();
  if (!cachedActiveId) {
    cachedActiveId = loadActiveId(addrs);
  }
  return addrs.find((a) => a.id === cachedActiveId) || addrs[0] || DEFAULT_ADDRESSES[0];
}

export function setActiveAddress(id: string) {
  const addrs = getAddresses();
  if (addrs.some((a) => a.id === id)) {
    cachedActiveId = id;
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_KEY, id);
    }
    notify();
  }
}

export function addAddress(data: Omit<UserAddress, "id">): UserAddress {
  const newAddr: UserAddress = {
    ...data,
    id: `addr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };
  const list = [newAddr, ...getAddresses()];
  cachedAddresses = list;
  cachedActiveId = newAddr.id;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(ACTIVE_KEY, newAddr.id);
  }
  notify();
  return newAddr;
}

export function removeAddress(id: string) {
  const list = getAddresses().filter((a) => a.id !== id);
  cachedAddresses = list;
  if (cachedActiveId === id) {
    cachedActiveId = list[0]?.id || null;
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (cachedActiveId) localStorage.setItem(ACTIVE_KEY, cachedActiveId);
  }
  notify();
}

export function openAddressDrawer() {
  isDrawerOpen = true;
  notify();
}

export function closeAddressDrawer() {
  isDrawerOpen = false;
  notify();
}

export function getAddressDrawerOpen(): boolean {
  return isDrawerOpen;
}

export function subscribeAddresses(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAddresses() {
  return useSyncExternalStore(
    subscribeAddresses,
    () => ({
      addresses: getAddresses(),
      activeAddress: getActiveAddress(),
      isOpen: getAddressDrawerOpen(),
    }),
    () => ({
      addresses: DEFAULT_ADDRESSES,
      activeAddress: DEFAULT_ADDRESSES[0],
      isOpen: false,
    })
  );
}
