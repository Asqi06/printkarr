"use client";

import { useSyncExternalStore } from "react";

export type CustomerAddress = {
  id: string;
  tag: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  pin: string;
  isDefault?: boolean;
};

export type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  college?: string;
  addresses: CustomerAddress[];
};

export type WalletTransaction = {
  id: string;
  customerId: string;
  amount: number;
  kind: "credit" | "debit";
  source?: "topup" | "bonus" | "order" | "admin-credit" | "refund";
  label: string;
  at: string;
  paymentId?: string;
};

const STORAGE_KEY_CUSTOMERS = "pk_customers_v2";
const STORAGE_KEY_TX = "pk_wallet_tx_v2";

/**
 * Real customers and wallet amounts migrated directly from E:\prntkr\data\db.json
 */
export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: "CUS-gmuqlfkbw",
    name: "PRINSKUMAR SINGH",
    email: "230860116032@laxmi.edu.in",
    phone: "+91 6354362220",
    walletBalance: 111,
    college: "Laxmi Institute of Technology (LIT), Sarigam",
    addresses: [
      {
        id: "ADR-c98a42bf-5d9b-4816-863b-5fb64141dc24",
        tag: "College",
        name: "PRINSKUMAR SINGH",
        phone: "+91 6354362220",
        address: "LIT Sarigam Campus, Boys Hostel",
        area: "Sarigam",
        pin: "396155",
        isDefault: false,
      },
      {
        id: "ADR-76a87abb-84b9-4d72-a7f7-0434ec575e6c",
        tag: "School / College",
        name: "PRINSKUMAR SINGH",
        phone: "+91 6354362220",
        address: "Laxmi Institute of Technology Main Gate",
        area: "Sarigam",
        pin: "396155",
        isDefault: true,
      },
    ],
  },
  {
    id: "CUS-gmv20c91a",
    name: "Deepak Chauhan",
    email: "hlwdeepk@gmail.com",
    phone: "+91 7096510217",
    walletBalance: 63,
    college: "Laxmi Institute of Technology, Sarigam",
    addresses: [
      {
        id: "ADR-84e014e6-6aae-4a82-8e2b-3446884f0b67",
        tag: "College",
        name: "Deepak Chauhan",
        phone: "+91 7096510217",
        address: "Laxmi Institute of Technology Sarigam",
        area: "Bhilad",
        pin: "396105",
        isDefault: true,
      },
    ],
  },
  {
    id: "CUS-mujdsfm0",
    name: "ANIRUDH VERMA",
    email: "230860116038@laxmi.edu.in",
    phone: "+91 9016703180",
    walletBalance: 150,
    college: "Laxmi Institute of Technology (LIT), Sarigam",
    addresses: [
      {
        id: "ADRmuztljra",
        tag: "College",
        name: "ANIRUDH VERMA",
        phone: "+91 9016703180",
        address: "LIT Sarigam campus, Room 204",
        area: "Sarigam",
        pin: "396155",
        isDefault: true,
      },
      {
        id: "ADRmuzfn4gn",
        tag: "Home",
        name: "ANIRUDH VERMA",
        phone: "+91 9016703180",
        address: "Sarjan Residency B-106, Chala Vapi",
        area: "Vapi",
        pin: "396191",
        isDefault: false,
      },
    ],
  },
  {
    id: "CUS-gmuiwykbe",
    name: "Techmax Admin Test",
    email: "techmax1245@gmail.com",
    phone: "+91 9016703180",
    walletBalance: 50,
    college: "LIT",
    addresses: [
      {
        id: "ADRmuwlqyhp",
        tag: "Home",
        name: "Techmax",
        phone: "+91 9016703180",
        address: "Sarjan Residency B-106, Chala Vapi",
        area: "Vapi",
        pin: "396191",
        isDefault: true,
      },
      {
        id: "ADR-30b0e592-4492-4801-b769-99cc9b3119d2",
        tag: "College",
        name: "Techmax",
        phone: "+91 9016703180",
        address: "LIT Sarigam campus",
        area: "Sarigam",
        pin: "396155",
        isDefault: false,
      },
    ],
  },
  {
    id: "CUS-muzn9flk",
    name: "Manas Manu Singh",
    email: "manas97124@gmail.com",
    phone: "+91 9106934343",
    walletBalance: 25,
    college: "Laxmi Institute of Technology",
    addresses: [
      {
        id: "ADRmuzn9flk",
        tag: "College",
        name: "Manas Manu Singh",
        phone: "+91 9106934343",
        address: "C-407, Samarth Apartment near Hindi School Saraswati Nagar",
        area: "Vapi",
        pin: "396191",
        isDefault: true,
      },
    ],
  },
  {
    id: "CUS-gmutvzyv7",
    name: "Lucky Singh",
    email: "luckysingh24356@gmail.com",
    phone: "+91 9328291023",
    walletBalance: 20,
    college: "LIT Sarigam",
    addresses: [
      {
        id: "ADR-532ebdb3-a794-40e1-a331-a8cd18a6122c",
        tag: "College",
        name: "Lucky Singh",
        phone: "+91 9328291023",
        address: "LIT Sarigam campus",
        area: "Sarigam",
        pin: "396155",
        isDefault: true,
      },
    ],
  },
  {
    id: "CUS-gmv2e9qsx",
    name: "Narendra Bishnoi",
    email: "itsnarsapcok29@gmail.com",
    phone: "+91 9636087312",
    walletBalance: 30,
    college: "ROFEL College, Vapi",
    addresses: [
      {
        id: "ADR-efaeea2b-fd4c-4078-aeeb-07d1d76ba601",
        tag: "Home",
        name: "Narendra Bishnoi",
        phone: "+91 9636087312",
        address: "Satadhar Society near Riddhi Siddhi Hospital, Muktanand Marg Chala",
        area: "Vapi",
        pin: "396191",
        isDefault: true,
      },
    ],
  },
  {
    id: "CUS-mv41io6h",
    name: "Ankit Singh",
    email: "ankit962481@gmail.com",
    phone: "+91 9624817761",
    walletBalance: 15,
    college: "LIT Sarigam",
    addresses: [
      {
        id: "ADRmv41io6h",
        tag: "College",
        name: "Ankit Singh",
        phone: "+91 9624817761",
        address: "LIT Sarigam campus, Boys Hostel",
        area: "Sarigam",
        pin: "396155",
        isDefault: true,
      },
    ],
  },
  {
    id: "CUS-gmut9yyn1",
    name: "Aditya Jha",
    email: "hlwadityaa@gmail.com",
    phone: "+91 7048667705",
    walletBalance: 0,
    college: "Laxmi Vidyapeeth",
    addresses: [],
  },
  {
    id: "CUS-gmv10gh5d",
    name: "Prince Singh",
    email: "princesingh6356@gmail.com",
    phone: "+91 6354362220",
    walletBalance: 0,
    college: "LIT",
    addresses: [],
  },
  {
    id: "CUS-gmupi131k",
    "name": "Krish Patel",
    email: "kpatel97368@gmail.com",
    phone: "+91 98251 04921",
    walletBalance: 0,
    college: "ROFEL Arts & Commerce",
    addresses: [],
  },
  {
    id: "CUS-gmuto0sok",
    name: "Maharshi Patel",
    email: "rockysp2910@gmail.com",
    phone: "+91 98254 77120",
    walletBalance: 0,
    college: "LIT Sarigam",
    addresses: [],
  },
  {
    id: "CUS-gmutv13wi",
    name: "Sudhansh Lone",
    email: "synnader@gmail.com",
    phone: "+91 97230 44192",
    walletBalance: 0,
    college: "Laxmi Vidyapeeth",
    addresses: [],
  },
  {
    id: "CUS-gmv1xy4rb",
    name: "Rutvi Patel",
    email: "rutvi8213@gmail.com",
    phone: "+91 99042 11983",
    walletBalance: 0,
    college: "ROFEL College Vapi",
    addresses: [],
  },
  {
    id: "CUS-gmv2vrbca",
    name: "Said Sakour",
    email: "saidsakour4@gmail.com",
    phone: "+91 98241 55902",
    walletBalance: 0,
    college: "LIT Sarigam",
    addresses: [],
  },
  {
    id: "CUS-gmv4yfnqz",
    name: "Tanvi Sharma",
    email: "sd590686@gmail.com",
    phone: "+91 98256 33102",
    walletBalance: 0,
    college: "Laxmi Vidyapeeth",
    addresses: [],
  },
];

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx-topup-prins-1",
    customerId: "CUS-gmuqlfkbw",
    amount: 199,
    kind: "credit",
    source: "topup",
    label: "Top-up via Razorpay (pay_TiwcjbzIZT)",
    at: "2026-10-02T06:42:35.711Z",
    paymentId: "pay_TiwcjbzIZTpf0x",
  },
  {
    id: "tx-bonus-prins-1",
    customerId: "CUS-gmuqlfkbw",
    amount: 26,
    kind: "credit",
    source: "bonus",
    label: "Study Wallet Offer Bonus (+₹26)",
    at: "2026-10-02T06:42:35.711Z",
  },
  {
    id: "tx-debit-prins-1",
    customerId: "CUS-gmuqlfkbw",
    amount: -17,
    kind: "debit",
    source: "order",
    label: "Order #PK-1027 · 1-Click Wallet Pay",
    at: "2026-10-02T08:20:47.245Z",
  },
  {
    id: "tx-debit-prins-2",
    customerId: "CUS-gmuqlfkbw",
    amount: -28,
    kind: "debit",
    source: "order",
    label: "Order #PK-1028 · 1-Click Wallet Pay",
    at: "2026-10-02T12:01:45.891Z",
  },
  {
    id: "tx-topup-deepak-1",
    customerId: "CUS-gmv20c91a",
    amount: 100,
    kind: "credit",
    source: "topup",
    label: "Top-up via Razorpay (pay_Tm6cKfhfKL)",
    at: "2026-10-10T06:26:28.840Z",
    paymentId: "pay_Tm6cKfhfKLAeG1",
  },
  {
    id: "tx-bonus-deepak-1",
    customerId: "CUS-gmv20c91a",
    amount: 25,
    kind: "credit",
    source: "bonus",
    label: "Verified Top-up Bonus (+₹25)",
    at: "2026-10-10T07:10:53.236Z",
  },
  {
    id: "tx-debit-deepak-1",
    customerId: "CUS-gmv20c91a",
    amount: -62,
    kind: "debit",
    source: "order",
    label: "Basket SHOP-d9efb9e1 · Xerox & Essentials",
    at: "2026-10-11T12:32:37.774Z",
  },
];

let cachedCustomers: CustomerRecord[] | null = null;
let cachedTransactions: WalletTransaction[] | null = null;
const customerListeners = new Set<() => void>();

function notifyCustomers() {
  for (const l of customerListeners) l();
}

function loadCustomers(): CustomerRecord[] {
  if (typeof window === "undefined") return INITIAL_CUSTOMERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (!raw) return INITIAL_CUSTOMERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CUSTOMERS;
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

function loadTransactions(): WalletTransaction[] {
  if (typeof window === "undefined") return INITIAL_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TX);
    if (!raw) return INITIAL_TRANSACTIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TRANSACTIONS;
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

function persistCustomers() {
  if (typeof window === "undefined" || !cachedCustomers) return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(cachedCustomers));
  } catch {
    // storage quota
  }
}

function persistTransactions() {
  if (typeof window === "undefined" || !cachedTransactions) return;
  try {
    localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(cachedTransactions));
  } catch {
    // storage quota
  }
}

export function getCustomers(): CustomerRecord[] {
  if (cachedCustomers === null) {
    cachedCustomers = loadCustomers();
  }
  return cachedCustomers;
}

export function getTransactions(): WalletTransaction[] {
  if (cachedTransactions === null) {
    cachedTransactions = loadTransactions();
  }
  return cachedTransactions;
}

export function getCustomerById(id: string): CustomerRecord | undefined {
  return getCustomers().find((c) => c.id.toUpperCase() === id.trim().toUpperCase());
}

export function findCustomer(identifier: string): CustomerRecord | undefined {
  const clean = identifier.trim().toLowerCase();
  return getCustomers().find(
    (c) =>
      c.id.toLowerCase() === clean ||
      c.email.toLowerCase() === clean ||
      c.phone.replace(/\D/g, "") === clean.replace(/\D/g, "")
  );
}

export function getCustomerTransactions(customerId: string): WalletTransaction[] {
  return getTransactions().filter((tx) => tx.customerId === customerId);
}

export function creditCustomerWallet(
  customerId: string,
  amount: number,
  label: string,
  source: WalletTransaction["source"] = "topup",
  paymentId?: string
): number {
  const customers = getCustomers();
  const txs = getTransactions();
  const idx = customers.findIndex((c) => c.id === customerId);
  if (idx < 0) return 0;

  const current = customers[idx];
  const newBalance = Math.round((current.walletBalance + amount) * 100) / 100;
  const updatedCustomer = { ...current, walletBalance: newBalance };

  cachedCustomers = [
    ...customers.slice(0, idx),
    updatedCustomer,
    ...customers.slice(idx + 1),
  ];

  const newTx: WalletTransaction = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    customerId,
    amount,
    kind: "credit",
    source,
    label,
    at: new Date().toISOString(),
    paymentId,
  };

  cachedTransactions = [newTx, ...txs];
  persistCustomers();
  persistTransactions();
  notifyCustomers();
  return newBalance;
}

export function debitCustomerWallet(
  customerId: string,
  amount: number,
  label: string
): boolean {
  const customers = getCustomers();
  const txs = getTransactions();
  const idx = customers.findIndex((c) => c.id === customerId);
  if (idx < 0) return false;

  const current = customers[idx];
  if (current.walletBalance < amount) return false;

  const newBalance = Math.round((current.walletBalance - amount) * 100) / 100;
  const updatedCustomer = { ...current, walletBalance: newBalance };

  cachedCustomers = [
    ...customers.slice(0, idx),
    updatedCustomer,
    ...customers.slice(idx + 1),
  ];

  const newTx: WalletTransaction = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    customerId,
    amount: -amount,
    kind: "debit",
    source: "order",
    label,
    at: new Date().toISOString(),
  };

  cachedTransactions = [newTx, ...txs];
  persistCustomers();
  persistTransactions();
  notifyCustomers();
  return true;
}

export function subscribeCustomers(listener: () => void): () => void {
  customerListeners.add(listener);
  return () => {
    customerListeners.delete(listener);
  };
}

export function useCustomers() {
  const customers = useSyncExternalStore(
    subscribeCustomers,
    getCustomers,
    () => INITIAL_CUSTOMERS
  );
  const transactions = useSyncExternalStore(
    subscribeCustomers,
    getTransactions,
    () => INITIAL_TRANSACTIONS
  );

  return {
    customers,
    transactions,
    creditCustomerWallet,
    debitCustomerWallet,
    getCustomerById,
    findCustomer,
    getCustomerTransactions,
  };
}
