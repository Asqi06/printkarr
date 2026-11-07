"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import {
  ACCEPTED,
  MAX_FILE_MB,
  detectPages,
  fileKind,
  fmtSize,
  newId,
  removeUpload,
  saveUpload,
  type UploadedMeta,
} from "@/lib/uploadStore";

type Row = UploadedMeta & { pending: boolean };

/** Homepage quick-upload: drag, browse, page detection, straight to /order. */
export function QuickUpload({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [drag, setDrag] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const next: File[] = [];
    for (const f of Array.from(files)) {
      const kind = fileKind(f.name);
      if (!kind) {
        setErrors((e) => [...e.slice(-2), `“${f.name}”: only ${ACCEPTED.join(", ").toUpperCase()} files are accepted`]);
        continue;
      }
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        setErrors((e) => [...e.slice(-2), `“${f.name}” is over ${MAX_FILE_MB} MB`]);
        continue;
      }
      next.push(f);
    }
    if (next.length === 0) return;
    void (async () => {
      for (const f of next) {
        const id = newId();
        const meta: UploadedMeta = { id, name: f.name, size: f.size, type: f.type, pages: null };
        setRows((r) => [...r, { ...meta, pending: true }]);
        await saveUpload(f, meta);
        const pages = await detectPages(f);
        if (pages !== null) await saveUpload(f, { ...meta, pages });
        setRows((r) =>
          r.map((row) => (row.id === id ? { ...row, pages, pending: false } : row)),
        );
      }
    })();
  }, []);

  const remove = (id: string) => {
    setRows((r) => r.filter((x) => x.id !== id));
    void removeUpload(id);
  };

  const pagesSum = rows.reduce((n, x) => n + (x.pages ?? 0), 0);
  const counting = rows.some((x) => x.pending);

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          drag
            ? "border-cobalt bg-cobalt/[0.06]"
            : "border-ink/20 bg-white hover:border-ink/40 hover:bg-white/60"
        }`}
      >
        <FileGlyph drag={drag} />
        <div>
          <p className="font-grotesk text-lg font-semibold text-ink">
            {drag ? "Drop them right here" : "Drag files here, or browse"}
          </p>
          <p className="mt-1 text-sm text-slate">
            PDF, JPG, PNG · up to {MAX_FILE_MB} MB each · multiple files OK
          </p>
        </div>
        <span className={drag ? "btn btn-ink" : "btn btn-ghost"}>
          {drag ? "Add files →" : "Choose files"}
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.map((e) => `.${e}`).join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {errors.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm text-magenta">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      ) : null}

      {rows.length > 0 ? (
        <div className={`card overflow-hidden ${compact ? "" : ""}`}>
          <ul className="divide-y divide-ink/[0.07]">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex h-8 w-12 shrink-0 items-center justify-center rounded-md font-ops text-[10px] font-semibold tracking-wide ${
                    row.pages !== null ? "bg-karr text-ink" : "bg-ink/[0.06] text-slate"
                  }`}
                >
                  {row.pending ? "…" : row.pages !== null ? `${row.pages}p` : "?p"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{row.name}</p>
                  <p className="font-ops text-xs text-slate">{fmtSize(row.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  aria-label={`Remove ${row.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/[0.07] bg-paper/60 px-4 py-3">
            <p className="font-ops text-xs text-slate">
              {rows.length} {rows.length === 1 ? "file" : "files"}
              {counting ? " · detecting pages…" : pagesSum > 0 ? ` · ${pagesSum} pages detected` : ""}
            </p>
            <Link href="/order" className="btn btn-karr px-4 py-2 text-sm">
              configure print →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FileGlyph({ drag }: { drag: boolean }) {
  return (
    <svg width="52" height="46" viewBox="0 0 52 46" fill="none" aria-hidden>
      <g className={drag ? "float-soft" : undefined}>
        <rect x="6" y="6" width="26" height="34" rx="4" fill="#F8F6F0" stroke="#0E1A2B" strokeOpacity="0.25" strokeWidth="2" transform="rotate(-6 19 23)" />
        <rect x="16" y="9" width="26" height="34" rx="4" fill="#0E1A2B" />
        <path d="M23 20h12M23 27h8" stroke="#F8F6F0" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
        <circle cx="38" cy="9" r="8" fill="#FFC700" />
        <path d="M38 5.5v7M34.5 9h7" stroke="#0E1A2B" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
