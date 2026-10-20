// Local-first storage for worksheet answers (Mark, Oct 20 2026). Answers live in this
// browser's IndexedDB and in a folder the person picks. Nothing here touches the network.

import type { Answers } from "@/worksheets/types";

export interface StoredWorksheet {
  id: string;
  answers: Answers;
  updatedAt: string; // ISO time of the last edit
  savedToFolderAt?: string; // ISO time of the last "Save to my folder"
  version?: number; // skills: counted up each time a changed skill is saved or downloaded
  exportedHash?: string; // skills: fingerprint of the last saved or downloaded file
}

// Worksheet answers use the worksheet id; skill answers use "skill:<template id>"; the name the
// reader gives once for every skill lives in "skill:shared".
export const SKILL_PREFIX = "skill:";
export const SHARED_ID = "skill:shared";

const DB_NAME = "workbook-vault";
const STORE = "worksheets";
const META = "meta";

function open(idb: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = idb.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
      req.result.createObjectStore(META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class AnswerStore {
  constructor(private idb: IDBFactory = indexedDB) {}

  private async tx(store: string, mode: IDBTransactionMode) {
    const db = await open(this.idb);
    return db.transaction(store, mode).objectStore(store);
  }

  async save(id: string, answers: Answers, now = new Date()): Promise<StoredWorksheet> {
    const prev = await this.get(id);
    const rec: StoredWorksheet = { ...prev, id, answers, updatedAt: now.toISOString() };
    await done((await this.tx(STORE, "readwrite")).put(rec));
    return rec;
  }

  async get(id: string): Promise<StoredWorksheet | undefined> {
    return done((await this.tx(STORE, "readonly")).get(id));
  }

  async all(): Promise<StoredWorksheet[]> {
    return done((await this.tx(STORE, "readonly")).getAll());
  }

  async markSavedToFolder(ids: string[], at = new Date()): Promise<void> {
    for (const id of ids) {
      const rec = await this.get(id);
      if (rec) await done((await this.tx(STORE, "readwrite")).put({ ...rec, savedToFolderAt: at.toISOString() }));
    }
  }

  // Worksheets edited since they were last saved to the person's folder.
  async unsavedToFolder(): Promise<string[]> {
    return (await this.all()).filter((r) => !r.savedToFolderAt || r.savedToFolderAt < r.updatedAt).map((r) => r.id);
  }

  async replaceAll(records: StoredWorksheet[]): Promise<void> {
    for (const r of records) await done((await this.tx(STORE, "readwrite")).put(r));
  }

  // The folder handle is remembered so "Save to my folder" is one click after the first time.
  async setFolderHandle(handle: unknown): Promise<void> {
    await done((await this.tx(META, "readwrite")).put(handle, "folder"));
  }

  async getFolderHandle<T>(): Promise<T | undefined> {
    return done((await this.tx(META, "readonly")).get("folder"));
  }
}
