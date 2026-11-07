/**
 * Campaign Wallet Top-Up Packs, Coupons, and Referral Program
 * Exact configurations and offers migrated from E:\prntkr\data\db.json
 */

export type WalletOffer = {
  id: string;
  name: string;
  amount: number;
  bonus: number;
  totalCredit: number;
  badge?: string;
  tagline: string;
  popular?: boolean;
  perks: string[];
  firstOnly?: boolean;
  freeFiles?: number;
};

export const WALLET_OFFERS: WalletOffer[] = [
  {
    id: "first",
    name: "First Wallet Welcome Pack",
    amount: 49,
    bonus: 10,
    totalCredit: 59,
    badge: "New User",
    tagline: "Pay ₹49 and get ₹59 wallet balance + Free First Print Batch",
    perks: ["₹10 Instant Free Bonus", "Free First Batch Delivery", "Valid for 90 days"],
    firstOnly: true,
  },
  {
    id: "trial",
    name: "Trial Student Wallet",
    amount: 99,
    bonus: 26,
    totalCredit: 125,
    badge: "+26% Extra",
    tagline: "Pay ₹99 and get ₹125 wallet credit instantly",
    perks: ["₹26 Free Bonus Credit", "1-Click Instant Xerox", "No UPI PIN needed"],
  },
  {
    id: "files",
    name: "Wallet + 3 Free Files Pack",
    amount: 149,
    bonus: 0,
    totalCredit: 149,
    badge: "Free Print Pass",
    tagline: "₹149 balance + 3 Free Document Print passes",
    perks: ["Full ₹149 Cash Balance", "3 Free Assignment Files", "Valid on B&W & Color"],
    freeFiles: 3,
  },
  {
    id: "study",
    name: "Study Semester Wallet",
    amount: 199,
    bonus: 26,
    totalCredit: 225,
    badge: "Most Popular",
    popular: true,
    tagline: "Pay ₹199 and get ₹225 wallet credit for college assignments",
    perks: ["₹26 Free Extra Credit", "Priority Campus Dispatch", "Covers 150+ pages"],
  },
  {
    id: "semester",
    name: "Semester Power Pack",
    amount: 499,
    bonus: 76,
    totalCredit: 575,
    badge: "+₹76 Free",
    tagline: "Pay ₹499 and get ₹575 credit + Free Spiral Binding voucher",
    perks: ["₹76 Instant Bonus", "Free Spiral Binding on Project", "VIP Dark-Store Queue"],
  },
  {
    id: "power",
    name: "Campus Pro Power Wallet",
    amount: 799,
    bonus: 151,
    totalCredit: 950,
    badge: "Best Value",
    tagline: "Pay ₹799 and get ₹950 credit (+₹151 Cash Bonus)",
    perks: ["Massive ₹151 Bonus", "100% Free Doorstep Delivery", "Project Hardcover Discount"],
  },
];

export type CouponRecord = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  desc: string;
  influencer?: string;
};

export const ACTIVE_COUPONS: CouponRecord[] = [
  {
    code: "WELCOME10",
    type: "percent",
    value: 10,
    minOrder: 29,
    desc: "10% off on your first order above ₹29 (up to ₹50)",
  },
  {
    code: "SUBMISSION15",
    type: "percent",
    value: 15,
    minOrder: 49,
    desc: "15% off college assignment & project print submissions above ₹49",
  },
  {
    code: "KHUSH10",
    type: "percent",
    value: 10,
    minOrder: 29,
    desc: "Special 10% student community discount",
    influencer: "Khushi Singh",
  },
  {
    code: "PRINTKARR",
    type: "fixed",
    value: 15,
    minOrder: 100,
    desc: "Flat ₹15 off on orders above ₹100",
  },
  {
    code: "STUDENT5",
    type: "fixed",
    value: 5,
    minOrder: 20,
    desc: "Flat ₹5 instant student voucher",
  },
];

export const REFERRAL_PROGRAM = {
  enabled: true,
  friendDiscount: 20,
  friendMinOrder: 59,
  referrerCredit: 15,
  minTopup: 99,
  milestones: [
    { referrals: 3, bonus: 50, label: "Invite 3 classmates → Get ₹50 cash bonus" },
    { referrals: 5, bonus: 100, label: "Invite 5 classmates → Get ₹100 cash bonus" },
  ],
};
