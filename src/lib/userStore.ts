"use client";

import { useSyncExternalStore } from "react";

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

const STORAGE_KEY = "pk_user_v2";

const DEFAULT_USER: UserProfile = {
  id: "usr-anirudh-01",
  name: "Anirudh Verma",
  email: "anirudh.verma@gmail.com",
  phone: "+91 90167 03180",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AV&backgroundColor=0c831f",
  isLoggedIn: true,
  isStudent: true,
  collegeName: "Laxmi Institute of Technology (LIT), Sarigam",
  walletBalance: 150,
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
    return parsed && typeof parsed === "object" ? parsed : DEFAULT_USER;
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

export function loginWithGoogle(): UserProfile {
  const user: UserProfile = {
    ...DEFAULT_USER,
    isLoggedIn: true,
  };
  cachedUser = user;
  persistUser(user);
  notify();
  return user;
}

export function logout() {
  const user: UserProfile = {
    ...DEFAULT_USER,
    isLoggedIn: false,
  };
  cachedUser = user;
  persistUser(user);
  notify();
}

export function topUpWallet(amount: number): number {
  const user = getUser();
  // Bonus ladder: ₹100 -> +5%, ₹250 -> +10%, ₹500 -> +15%
  let bonus = 0;
  if (amount >= 500) bonus = Math.round(amount * 0.15);
  else if (amount >= 250) bonus = Math.round(amount * 0.1);
  else if (amount >= 100) bonus = Math.round(amount * 0.05);

  const newBalance = user.walletBalance + amount + bonus;
  cachedUser = { ...user, walletBalance: newBalance };
  persistUser(cachedUser);
  notify();
  return newBalance;
}

export function deductWallet(amount: number): boolean {
  const user = getUser();
  if (user.walletBalance < amount) return false;
  const newBalance = Math.round((user.walletBalance - amount) * 100) / 100;
  cachedUser = { ...user, walletBalance: newBalance };
  persistUser(cachedUser);
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
    logout,
    topUpWallet,
    deductWallet,
    updateUserProfile,
  };
}
