"use client";

import { useState, useEffect } from "react";
import {
  useAddresses,
  setActiveAddress,
  addAddress,
  closeAddressDrawer,
  type UserAddress,
} from "@/lib/addressStore";

export function AddressDrawer() {
  const { addresses, activeAddress, isOpen } = useAddresses();
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states for new address
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState<"Vapi" | "Sarigam" | "Daman" | "Bhilad">("Vapi");
  const [locality, setLocality] = useState("");
  const [pin, setPin] = useState("396191");
  const [landmark, setLandmark] = useState("");
  const [tag, setTag] = useState<"Home" | "College" | "Work" | "Other">("Home");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAddressDrawer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    setActiveAddress(id);
    closeAddressDrawer();
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setFormError("Please enter your name");
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10)
      return setFormError("Enter a valid 10-digit mobile number");
    if (!address.trim() || address.length < 5)
      return setFormError("Enter a complete street or building address");
    if (!/^\d{6}$/.test(pin.trim()))
      return setFormError("Enter a valid 6-digit PIN code");

    addAddress({
      name: name.trim(),
      phone: phone.trim().startsWith("+91") ? phone.trim() : `+91 ${phone.trim()}`,
      address: address.trim(),
      area,
      locality: locality.trim() || area,
      pin: pin.trim(),
      landmark: landmark.trim() || undefined,
      tag,
      isDefault: false,
    });

    setIsAddingNew(false);
    setFormError("");
    closeAddressDrawer();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/60 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl transition-transform duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div>
            <h2 id="address-drawer-title" className="font-grotesk text-xl font-bold text-ink">
              Choose delivery address
            </h2>
            <p className="text-xs text-slate mt-0.5">
              Select a saved location or add a new delivery spot
            </p>
          </div>
          <button
            type="button"
            onClick={closeAddressDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate/10 text-ink hover:bg-slate/20 transition"
            aria-label="Close address drawer"
          >
            ✕
          </button>
        </div>

        {/* Saved Addresses List */}
        {!isAddingNew ? (
          <div className="mt-4 space-y-3">
            <div className="space-y-2.5">
              {addresses.map((addr) => {
                const isSelected = addr.id === activeAddress?.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => handleSelect(addr.id)}
                    className={`group cursor-pointer rounded-2xl border-2 p-4 transition-all duration-150 ${
                      isSelected
                        ? "border-[#0c831f] bg-[#e8f8ec]/40 shadow-xs"
                        : "border-ink/10 hover:border-ink/30 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 font-ops text-[11px] font-bold uppercase tracking-wider ${
                              addr.tag === "Home"
                                ? "bg-amber-100 text-amber-900"
                                : addr.tag === "College"
                                ? "bg-blue-100 text-blue-900"
                                : "bg-purple-100 text-purple-900"
                            }`}
                          >
                            {addr.tag === "Home" ? "🏠" : addr.tag === "College" ? "🎓" : "💼"}{" "}
                            {addr.tag}
                          </span>
                          <span className="font-semibold text-sm text-ink">{addr.name}</span>
                          <span className="text-xs text-slate font-mono">{addr.phone}</span>
                        </div>
                        <p className="text-sm font-medium text-ink leading-snug">
                          {addr.address}
                        </p>
                        <p className="text-xs text-slate">
                          {addr.locality}, {addr.area} - {addr.pin}
                          {addr.landmark ? ` (Landmark: ${addr.landmark})` : ""}
                        </p>
                      </div>

                      <div className="pt-1">
                        {isSelected ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0c831f] text-white text-xs font-bold shadow-xs">
                            ✓
                          </span>
                        ) : (
                          <span className="h-6 w-6 rounded-full border-2 border-ink/20 block group-hover:border-[#0c831f]" />
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-2 text-xs">
                      <span className="text-slate flex items-center gap-1">
                        ⚡ 30-45 min express available
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(addr.id);
                        }}
                        className="font-bold text-[#0c831f] hover:underline"
                      >
                        {isSelected ? "Delivering here" : "Deliver here →"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add new button */}
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(true);
                setFormError("");
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#0c831f]/50 bg-[#e8f8ec]/20 py-3.5 text-sm font-bold text-[#0c831f] hover:bg-[#e8f8ec]/50 transition"
            >
              <span>+ Add a new delivery address</span>
            </button>
          </div>
        ) : (
          /* Add New Address Form */
          <form onSubmit={handleSaveNew} className="mt-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-grotesk text-sm font-bold text-ink">
                Add New Delivery Location
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-slate hover:text-ink font-semibold"
              >
                ← Back to saved
              </button>
            </div>

            {formError ? (
              <div className="rounded-xl bg-red-50 p-2.5 text-xs font-medium text-red-600 border border-red-200">
                {formError}
              </div>
            ) : null}

            {/* Tag Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate mb-1">
                Save address as
              </label>
              <div className="flex gap-2">
                {(["Home", "College", "Work", "Other"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-bold border transition ${
                      tag === t
                        ? "border-[#0c831f] bg-[#0c831f] text-white shadow-xs"
                        : "border-ink/15 bg-white text-ink hover:border-ink/40"
                    }`}
                  >
                    {t === "Home" ? "🏠" : t === "College" ? "🎓" : t === "Work" ? "💼" : "📍"}{" "}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-[#0c831f] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit phone"
                  className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-[#0c831f] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate mb-1">
                Flat / House / Room No., Building / Hostel *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Room 302, Ganga Hostel, or Flat 4B, Surya Apts"
                className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-[#0c831f] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">
                  City / Area *
                </label>
                <select
                  value={area}
                  onChange={(e) =>
                    setArea(e.target.value as "Vapi" | "Sarigam" | "Daman" | "Bhilad")
                  }
                  className="w-full rounded-xl border border-ink/15 px-2.5 py-2 text-sm bg-white focus:border-[#0c831f] focus:outline-none"
                >
                  <option value="Vapi">Vapi</option>
                  <option value="Sarigam">Sarigam</option>
                  <option value="Daman">Daman</option>
                  <option value="Bhilad">Bhilad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate mb-1">
                  Locality / Landmark
                </label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Chala / LIT Gate"
                  className="w-full rounded-xl border border-ink/15 px-2.5 py-2 text-sm focus:border-[#0c831f] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="396191"
                  className="w-full rounded-xl border border-ink/15 px-2.5 py-2 text-sm font-mono focus:border-[#0c831f] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Behind D-Mart, Near Campus Canteen"
                className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-[#0c831f] focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#0c831f] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#096a18] transition flex items-center justify-center gap-2"
              >
                <span>Save Address &amp; Deliver Here →</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
