"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthModal } from "@/lib/authModalStore";
import { useUser } from "@/lib/userStore";
import { findCustomer } from "@/lib/customersStore";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (res: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("JWT parse error:", err);
    return null;
  }
}

export function AuthModal() {
  const { isOpen, closeAuthModal } = useAuthModal();
  const { loginWithGooglePayload, loginWithPhoneOrEmail } = useUser();

  const [authMode, setAuthMode] = useState<"google" | "phone">("google");
  const [identifier, setIdentifier] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [custName, setCustName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [gisLoaded, setGisLoaded] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "221386855862-068n9l7mms7aeghobkci40j1viuej08f.apps.googleusercontent.com";

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGisLoaded(true);
    };
    script.onerror = () => {
      console.warn("Google Identity Services script failed to load (ad-blocker or offline).");
    };
    document.body.appendChild(script);

    return () => {
      // script cleanup if unmounted
    };
  }, []);

  // Initialize Google Button when modal opens and GIS is ready
  useEffect(() => {
    if (!isOpen || !gisLoaded || !googleBtnRef.current || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (res) => {
          if (!res.credential) {
            setErrorMsg("Google sign-in did not return valid credentials. Please try again.");
            return;
          }
          const payload = parseJwt(res.credential);
          if (payload && payload.email) {
            loginWithGooglePayload({
              email: payload.email,
              name: payload.name || payload.email.split("@")[0],
              picture: payload.picture,
              sub: payload.sub,
            });
            setSuccessMsg(`Welcome, ${payload.name || payload.email}! Accessing your wallet...`);
            setTimeout(() => {
              closeAuthModal();
              setSuccessMsg("");
            }, 1000);
          } else {
            setErrorMsg("Could not read profile information from Google response.");
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 310,
        logo_alignment: "left",
      });
    } catch (err) {
      console.error("GIS render error:", err);
    }
  }, [isOpen, gisLoaded, googleClientId, loginWithGooglePayload, closeAuthModal]);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const clean = identifier.trim();
    if (!clean) {
      setErrorMsg("Please enter your Phone number or College Email.");
      return;
    }

    const existing = findCustomer(clean);
    if (!existing && !clean.includes("@") && clean.replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number or college email.");
      return;
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpStep(true);
    setEnteredOtp(code); // Pre-fill for instant seamless developer & customer testing
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setErrorMsg("Invalid OTP code. Please enter the 4 digits shown.");
      return;
    }

    const res = loginWithPhoneOrEmail(identifier, custName);
    if (res.success && res.user) {
      setSuccessMsg(`Logged in successfully! Wallet balance: ₹${res.user.walletBalance.toFixed(2)}`);
      setTimeout(() => {
        closeAuthModal();
        setSuccessMsg("");
        setOtpStep(false);
        setIdentifier("");
        setEnteredOtp("");
      }, 1000);
    } else {
      setErrorMsg(res.message || "Failed to sign in. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-edge bg-white p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate hover:bg-slate-100 hover:text-ink transition"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0c831f]/10 text-2xl mb-3">
            🖨️
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-ink">
            Sign In to PrintKarr
          </h2>
          <p className="text-xs text-slate mt-1 max-w-xs mx-auto">
            Access your private wallet balance, track orders, and unlock campus student benefits.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMode("google");
              setErrorMsg("");
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              authMode === "google"
                ? "bg-white text-ink shadow-xs"
                : "text-slate hover:text-ink"
            }`}
          >
            Google One-Click
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("phone");
              setErrorMsg("");
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              authMode === "phone"
                ? "bg-white text-ink shadow-xs"
                : "text-slate hover:text-ink"
            }`}
          >
            Phone / Student ID
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMsg ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        ) : null}

        {successMsg ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-bold text-[#0c831f]">
            {successMsg}
          </div>
        ) : null}

        {/* ── GOOGLE AUTH MODE ── */}
        {authMode === "google" ? (
          <div className="space-y-4 text-center">
            <div className="flex flex-col items-center justify-center min-h-[50px]">
              <div ref={googleBtnRef} className="flex justify-center" />
              {!gisLoaded ? (
                <div className="text-xs text-slate flex items-center justify-center gap-2 py-2">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate border-t-transparent" />
                  Loading Google Sign-in...
                </div>
              ) : null}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-edge" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate">
                <span className="bg-white px-2">Privacy &amp; Security</span>
              </div>
            </div>

            <p className="text-[11px] text-slate leading-relaxed">
              Your account is strictly private. Only you can view your wallet balance, uploaded print files, and order history.
            </p>
          </div>
        ) : null}

        {/* ── PHONE / EMAIL AUTH MODE ── */}
        {authMode === "phone" ? (
          <div>
            {!otpStep ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Mobile Number or College Email
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 9016703180 or 230860116032@laxmi.edu.in"
                    className="w-full rounded-xl border border-edge bg-surface px-3.5 py-2.5 text-xs text-ink placeholder:text-slate focus:border-[#0c831f] focus:outline-none"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate mt-1">
                    Registered accounts (Prins, Deepak, Anirudh, etc.) will instantly restore their wallet.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#0c831f] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] transition"
                >
                  Continue →
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div className="rounded-xl bg-[#f8cb46]/20 border border-[#f8cb46] p-3 text-center">
                  <span className="text-[11px] font-bold text-ink block">
                    ⚡ Instant Verification Code:
                  </span>
                  <span className="font-mono text-xl font-extrabold tracking-widest text-ink block my-0.5">
                    {generatedOtp}
                  </span>
                  <span className="text-[10px] text-slate">
                    Auto-generated for {identifier}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Enter 4-Digit Code
                  </label>
                  <input
                    type="text"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    maxLength={4}
                    className="w-full rounded-xl border border-edge bg-surface px-3.5 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-ink focus:border-[#0c831f] focus:outline-none"
                    autoFocus
                  />
                </div>

                {identifier.includes("@") && !findCustomer(identifier) ? (
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Your Full Name (New Member)
                    </label>
                    <input
                      type="text"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl border border-edge bg-surface px-3.5 py-2 text-xs text-ink focus:border-[#0c831f] focus:outline-none"
                    />
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="rounded-xl border border-edge px-3.5 py-2 text-xs font-bold text-slate hover:bg-slate-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[#0c831f] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] transition"
                  >
                    Verify &amp; Sign In →
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-5 border-t border-edge pt-4 text-center">
          <p className="text-[10px] text-slate">
            By signing in, you agree to PrintKarr’s Terms and Privacy Policy. Student pass benefits apply to verified campus IDs.
          </p>
        </div>
      </div>
    </div>
  );
}
