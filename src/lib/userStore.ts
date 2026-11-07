"use client";

import { useSyncExternalStore } from "react";
import {
  getCustomers,
  getCustomerById,
  findCustomer,
  registerCustomer,
  creditCustomerWallet,
  debitCustomerWallet,
  type CustomerRecord,
} from "./customersStore";
import { openAuthModal } from "./authModalStore";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  isLoggedIn: boolean;
  isStudent: boolean;
  collegeName?: string;
  walletBalance: number;
};

const STORAGE_KEY = "pk_user_v3";

export const GUEST_USER: UserProfile = {
  id: "",
  name: "Guest",
  email: "",
  phone: "",
  avatar: "",
  isLoggedIn: false,
  isStudent: false,
  walletBalance: 0,
};

/**
 * Fallback initial user (Prins Kumar Singh, LIT Sarigam, ₹111)
 */
export const DEFAULT_USER: UserProfile = {
  id: "CUS-gmuqlfkbw",
  name: "PRINSKUMAR SINGH",
  email: "230860116032@laxmi.edu.in",
  phone: "+91 6354362220",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=PS&backgroundColor=0c831f",
  isLoggedIn: true,
  isStudent: true,
  collegeName: "Laxmi Institute of Technology (LIT), Sarigam",
  walletBalance: 111,
};

let cachedUser: UserProfile | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function loadUser(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.id === "string") {
      // Sync latest balance from customer store if available
      if (parsed.id && parsed.isLoggedIn) {
        const cust = getCustomerById(parsed.id);
        if (cust) {
          parsed.walletBalance = cust.walletBalance;
        }
      }
      return parsed;
    }
    return DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
}

function persistUser(user: UserProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // storage unavailable
  }
}

export function getUser(): UserProfile {
  if (cachedUser === null) {
    cachedUser = loadUser();
  }
  return cachedUser;
}

/**
 * Login with decoded Google OAuth / Identity Services payload
 */
export function loginWithGooglePayload(payload: {
  email: string;
  name: string;
  picture?: string;
  sub?: string;
}): UserProfile {
  const cleanEmail = payload.email.trim().toLowerCase();
  let cust = findCustomer(cleanEmail);

  if (!cust) {
    cust = registerCustomer({
      name: payload.name || cleanEmail.split("@")[0].toUpperCase(),
      email: cleanEmail,
      phone: "",
    });
  }

  const isStudent = Boolean(
    cust.college ||
      cleanEmail.includes(".edu") ||
      cleanEmail.includes("laxmi") ||
      cleanEmail.includes("rofel")
  );

  const user: UserProfile = {
    id: cust.id,
    name: cust.name,
    email: cust.email,
    phone: cust.phone,
    avatar:
      payload.picture ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        cust.name
      )}&backgroundColor=0c831f`,
    isLoggedIn: true,
    isStudent,
    collegeName: cust.college || (isStudent ? "Campus Pass" : undefined),
    walletBalance: cust.walletBalance,
  };

  cachedUser = user;
  persistUser(user);
  notify();
  return user;
}

/**
 * Direct phone / college email authentication
 */
export function loginWithPhoneOrEmail(
  identifier: string,
  name?: string
): { success: boolean; user?: UserProfile; message?: string } {
  const clean = identifier.trim();
  if (!clean) {
    return { success: false, message: "Please provide a valid phone number or email." };
  }

  let cust = findCustomer(clean);

  if (!cust) {
    const isEmail = clean.includes("@");
    cust = registerCustomer({
      name: name?.trim() || (isEmail ? clean.split("@")[0].toUpperCase() : "Customer"),
      email: isEmail ? clean.toLowerCase() : `${clean.replace(/\D/g, "")}@user.printkarr.in`,
      phone: isEmail ? "" : clean,
    });
  }

  const isStudent = Boolean(
    cust.college ||
      cust.email.includes(".edu") ||
      cust.email.includes("laxmi") ||
      cust.email.includes("rofel")
  );

  const user: UserProfile = {
    id: cust.id,
    name: cust.name,
    email: cust.email,
    phone: cust.phone,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      cust.name
    )}&backgroundColor=0c831f`,
    isLoggedIn: true,
    isStudent,
    collegeName: cust.college || (isStudent ? "Campus Pass" : undefined),
    walletBalance: cust.walletBalance,
  };

  cachedUser = user;
  persistUser(user);
  notify();
  return { success: true, user };
}

/**
 * Triggers auth dialog for user to authenticate with their private account
 */
export function loginWithGoogle() {
  openAuthModal();
}

/**
 * Private individual sign out
 */
export function logout() {
  const user: UserProfile = {
    ...GUEST_USER,
  };
  cachedUser = user;
  persistUser(user);
  notify();
}

/**
 * Top up the user's wallet and sync with customer ledger
 */
export function topUpWallet(
  amount: number,
  customBonus = 0,
  label = "Wallet Top-up"
): number {
  const user = getUser();
  let bonus = customBonus;
  if (!customBonus) {
    if (amount >= 500) bonus = Math.round(amount * 0.15);
    else if (amount >= 250) bonus = Math.round(amount * 0.1);
    else if (amount >= 100) bonus = Math.round(amount * 0.05);
  }

  const newBalance = Math.round((user.walletBalance + amount + bonus) * 100) / 100;
  cachedUser = { ...user, walletBalance: newBalance };
  persistUser(cachedUser);

  // Sync with customersStore
  if (user.id) {
    creditCustomerWallet(
      user.id,
      amount + bonus,
      `${label} (+₹${bonus} Bonus)`,
      bonus > 0 ? "bonus" : "topup"
    );
  }

  notify();
  return newBalance;
}

/**
 * Deduct wallet balance for orders and sync with customer ledger
 */
export function deductWallet(amount: number, label = "Order Payment"): boolean {
  const user = getUser();
  if (user.walletBalance < amount) return false;
  const newBalance = Math.round((user.walletBalance - amount) * 100) / 100;
  cachedUser = { ...user, walletBalance: newBalance };
  persistUser(cachedUser);

  // Sync with customersStore
  if (user.id) {
    debitCustomerWallet(user.id, amount, label);
  }

  notify();
  return true;
}

export function updateUserProfile(patch: Partial<UserProfile>) {
  const user = getUser();
  cachedUser = { ...user, ...patch };
  persistUser(cachedUser);
  notify();
}

export function subscribeUser(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getServerUserSnapshot(): UserProfile {
  return DEFAULT_USER;
}

export function useUser() {
  const user = useSyncExternalStore(subscribeUser, getUser, getServerUserSnapshot);
  return {
    user,
    loginWithGoogle,
    loginWithGooglePayload,
    loginWithPhoneOrEmail,
    logout,
    topUpWallet,
    deductWallet,
    updateUserProfile,
  };
}
