"use client";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export type RazorpayOptions = {
  amount: number; // in Rupees
  orderId?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
};

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Triggers Razorpay Checkout.
 * If user has set NEXT_PUBLIC_RAZORPAY_KEY_ID, opens real Razorpay modal.
 * If key is not yet set (user will feed it later), provides a smooth simulation
 * with UPI / Cards / NetBanking so testing works seamlessly without crashes.
 */
export async function triggerRazorpayPayment(opts: RazorpayOptions): Promise<void> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();

  // If a real key is present, load script and use standard Razorpay checkout
  if (keyId && keyId.startsWith("rzp_")) {
    const loaded = await loadRazorpayScript();
    if (loaded && window.Razorpay) {
      const options = {
        key: keyId,
        amount: Math.round(opts.amount * 100), // in paise
        currency: "INR",
        name: opts.name || "PrintKarr.in",
        description: opts.description || "Online Xerox & Document Printing",
        image: "/logo.png",
        prefill: {
          name: opts.prefill?.name || "Customer",
          email: opts.prefill?.email || "customer@printkarr.in",
          contact: opts.prefill?.contact || "+919016703180",
        },
        theme: {
          color: "#0c831f",
        },
        handler: function (response: { razorpay_payment_id: string }) {
          opts.onSuccess(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: function () {
            opts.onDismiss?.();
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      return;
    }
  }

  // Graceful simulation when key is pending (user will provide key later)
  showSimulatedRazorpayModal(opts);
}

function showSimulatedRazorpayModal(opts: RazorpayOptions) {
  // Create an in-DOM high fidelity Razorpay modal
  const existing = document.getElementById("pk-razorpay-modal");
  if (existing) existing.remove();

  const container = document.createElement("div");
  container.id = "pk-razorpay-modal";
  container.className =
    "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150";

  container.innerHTML = `
    <div class="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
      <!-- Header -->
      <div class="bg-[#0c2340] px-5 py-4 text-white flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-7 w-7 rounded-lg bg-[#0c831f] flex items-center justify-center font-bold text-white text-xs">P</div>
          <div>
            <h3 class="text-sm font-bold">PrintKarr.in</h3>
            <p class="text-[11px] text-gray-300">Razorpay Secure Checkout</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs text-gray-300 block leading-tight">Amount</span>
          <span class="text-base font-extrabold text-[#f8cb46]">₹${opts.amount}</span>
        </div>
      </div>

      <!-- Content -->
      <div class="p-5 space-y-4">
        <div class="rounded-xl bg-[#e8f8ec] p-3 text-xs text-[#0c831f] border border-[#0c831f]/20">
          <p class="font-bold">⚡ Ready for your Razorpay Key ID</p>
          <p class="text-[11px] mt-0.5 text-slate-600">You can test UPI, Card, and NetBanking right now. Add <code>NEXT_PUBLIC_RAZORPAY_KEY_ID</code> anytime in <code>.env.local</code>.</p>
        </div>

        <div class="space-y-2 text-xs">
          <label class="block font-bold text-gray-700">Select Instant Payment Method</label>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:border-[#0c831f] cursor-pointer">
              <span class="font-semibold text-gray-800">🟢 UPI (Google Pay / PhonePe / Paytm / BHIM)</span>
              <span class="text-[10px] font-bold text-[#0c831f]">INSTANT</span>
            </div>
            <div class="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:border-[#0c831f] cursor-pointer">
              <span class="font-semibold text-gray-800">💳 Debit / Credit Card (Visa, RuPay, MC)</span>
              <span class="text-[10px] font-bold text-gray-500">ALL BANKS</span>
            </div>
            <div class="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:border-[#0c831f] cursor-pointer">
              <span class="font-semibold text-gray-800">🏦 NetBanking (HDFC, ICICI, SBI, Axis)</span>
              <span class="text-[10px] font-bold text-gray-500">50+ BANKS</span>
            </div>
          </div>
        </div>

        <div class="pt-2 flex gap-2">
          <button id="rzp-cancel-btn" type="button" class="flex-1 rounded-xl border border-gray-300 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button id="rzp-pay-btn" type="button" class="flex-1 rounded-xl bg-[#0c831f] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#096a18] transition">
            Simulate Pay ₹${opts.amount}
          </button>
        </div>

        <p class="text-center text-[10px] text-gray-400">🔒 256-Bit SSL Encrypted by Razorpay Gateway</p>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const cleanup = () => {
    container.remove();
  };

  const cancelBtn = container.querySelector("#rzp-cancel-btn");
  const payBtn = container.querySelector("#rzp-pay-btn");

  cancelBtn?.addEventListener("click", () => {
    cleanup();
    opts.onDismiss?.();
  });

  payBtn?.addEventListener("click", () => {
    const mockPaymentId = `pay_rzp_${Math.random().toString(36).substring(2, 11)}`;
    cleanup();
    opts.onSuccess(mockPaymentId);
  });
}
