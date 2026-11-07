"use client";

/**
 * Client-side upload relay (Phase 2 preview).
 * Files picked on the homepage are kept in IndexedDB so they can continue
 * into the order flow even after client navigation. A storage failure never
 * blocks ordering — the /order flow re-opens the file picker as fallback.
 */
export type UploadedMeta = {
  id: string;
  name: string;
  size: number;
  type: string;
  pages: number | null;
};

const DB_NAME = "printkarr";
const STORE = "uploads";

function db(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, { keyPath: "meta.id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveUpload(file: File, meta: UploadedMeta) {
  const d = await db();
  if (!d) return;
  const tx = d.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put({ file, meta });
}

export async function removeUpload(id: string) {
  const d = await db();
  if (!d) return;
  const tx = d.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
}

export async function loadUploads(): Promise<
  { file: File; meta: UploadedMeta }[]
> {
  const d = await db();
  if (!d) return [];
  return new Promise((resolve) => {
    try {
      const tx = d.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const rows = (req.result ?? []) as { file: File; meta: UploadedMeta }[];
        resolve(rows);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function clearUploads() {
  const d = await db();
  if (!d) return;
  const tx = d.transaction(STORE, "readwrite");
  tx.objectStore(STORE).clear();
}

/** Best-effort client-side page count for PDFs; images are 1 page. */
export async function detectPages(file: File): Promise<number | null> {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    try {
      const text = new TextDecoder("latin1").decode(
        await file.slice(0, 4_000_000).arrayBuffer(),
      );
      const typeCount = (
        text.match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []
      ).length;
      if (typeCount > 0) return typeCount;
      const count = text.match(/\/Count\s+(\d+)/);
      if (count) return parseInt(count[1], 10);
      return null;
    } catch {
      return null;
    }
  }
  if (file.type.startsWith("image/")) return 1;
  return null;
}

export const ACCEPTED = ["pdf", "jpg", "jpeg", "png"];
export const MAX_FILE_MB = 25;

export function fileKind(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ACCEPTED.includes(ext) ? ext.toUpperCase() : null;
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let seq = 0;
export function newId(): string {
  seq += 1;
  return `f${Date.now().toString(36)}${seq}`;
}
