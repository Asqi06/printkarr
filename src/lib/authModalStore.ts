"use client";

import { useSyncExternalStore } from "react";

let isOpen = false;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function openAuthModal() {
  isOpen = true;
  notify();
}

export function closeAuthModal() {
  isOpen = false;
  notify();
}

export function getAuthModalState(): boolean {
  return isOpen;
}

export function subscribeAuthModal(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAuthModal() {
  const open = useSyncExternalStore(subscribeAuthModal, getAuthModalState, () => false);
  return {
    isOpen: open,
    openAuthModal,
    closeAuthModal,
  };
}
