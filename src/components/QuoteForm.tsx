"use client";

import { useState } from "react";
import { waLink } from "@/lib/site";

/** Bulk quotation request — composes a WhatsApp handoff (or a copyable draft). */
export function QuoteForm() {
  const [f, setF] = useState({
    name: "",
    org: "",
    phone: "",
    email: "",
    pages: "",
    copies: "",
    printType: "black & white",
    date: "",
    location: "",
    info: "",
  });
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  const message =
    `hello printkarr! bulk quote request:%0A` +
    `name: ${f.name}%0A` +
    `organisation: ${f.org}%0A` +
    `phone: ${f.phone}%0A` +
    (f.email ? `email: ${f.email}%0A` : "") +
    `approx pages: ${f.pages} × ${f.copies} copies%0A` +
    `print type: ${f.printType}%0A` +
    (f.date ? `required by: ${f.date}%0A` : "") +
    `delivery location: ${f.location}%0A` +
    (f.info ? `notes: ${f.info}` : "");

  const link = waLink(message.replace(/%0A/g, "\n"));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (link) {
      window.open(link, "_blank", "noopener");
      return;
    }
    /* no WhatsApp number configured yet — offer a copyable draft */
    void navigator.clipboard
      .writeText(message.replace(/%0A/g, "\n"))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => setCopied(false));
  }

  return (
    <form onSubmit={submit} className="card grid gap-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="your name">
          <input required onChange={set("name")} className={IN} placeholder="full name" />
        </Field>
        <Field label="organisation / class">
          <input onChange={set("org")} className={IN} placeholder="e.g. Mehir Classes, 11th science" />
        </Field>
        <Field label="phone">
          <input
            required
            inputMode="numeric"
            onChange={set("phone")}
            className={IN}
            placeholder="10 digits"
          />
        </Field>
        <Field label="email (optional)">
          <input type="email" onChange={set("email")} className={IN} placeholder="you@example.com" />
        </Field>
        <Field label="approximate pages">
          <input required inputMode="numeric" onChange={set("pages")} className={IN} placeholder="e.g. 500" />
        </Field>
        <Field label="copies">
          <input required inputMode="numeric" onChange={set("copies")} className={IN} placeholder="e.g. 35" />
        </Field>
        <Field label="print type">
          <select onChange={set("printType")} className={IN} defaultValue="black & white">
            <option>black &amp; white</option>
            <option>colour</option>
            <option>mix of both</option>
          </select>
        </Field>
        <Field label="required by">
          <input type="date" onChange={set("date")} className={IN} />
        </Field>
        <Field label="delivery location" full>
          <input required onChange={set("location")} className={IN} placeholder="locality / college / office name" />
        </Field>
        <Field label="anything else? (optional)" full>
          <textarea rows={3} onChange={set("info")} className={IN} placeholder="binding, stapling, deadlines, paper quality…" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-karr">
          request quote →
        </button>
        {copied ? (
          <p className="text-sm text-ink">
            request copied to clipboard — paste it to us on WhatsApp ✓
          </p>
        ) : null}
        {!link ? (
          <p className="font-ops text-xs text-slate">
            WhatsApp opens with your draft · number being confirmed at launch
          </p>
        ) : null}
      </div>
    </form>
  );
}

const IN =
  "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate/60 focus:border-ink focus:outline-none focus:ring-2 focus:ring-cobalt/30";

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label
      className={`flex flex-col gap-1.5 text-sm font-medium text-ink ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      {label}
      {children}
    </label>
  );
}
