// Writing to and reading from the person's own folder. Chrome and Edge let a page write
// into a folder the person picks; elsewhere we hand them a zip instead. No network calls.

import { strToU8, zipSync, unzipSync, strFromU8 } from "fflate";
import { ANSWERS_PATH, type FileMap } from "./bundle";

type DirHandle = any;

export function canWriteFolders(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export async function pickFolder(): Promise<DirHandle> {
  return (window as any).showDirectoryPicker({ id: "workbook", mode: "readwrite" });
}

async function ensurePermission(dir: DirHandle): Promise<boolean> {
  const opts = { mode: "readwrite" };
  if ((await dir.queryPermission?.(opts)) === "granted") return true;
  return (await dir.requestPermission?.(opts)) === "granted";
}

export async function writeToFolder(dir: DirHandle, files: FileMap): Promise<void> {
  if (!(await ensurePermission(dir))) throw new Error("Permission to write to that folder wasn't granted.");
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split("/");
    let here = dir;
    for (const p of parts.slice(0, -1)) here = await here.getDirectoryHandle(p, { create: true });
    const file = await here.getFileHandle(parts.at(-1)!, { create: true });
    const w = await file.createWritable();
    await w.write(content);
    await w.close();
  }
}

export async function readAnswersFromFolder(dir: DirHandle): Promise<string> {
  let here = dir;
  const parts = ANSWERS_PATH.split("/");
  for (const p of parts.slice(0, -1)) here = await here.getDirectoryHandle(p);
  return (await (await here.getFileHandle(parts.at(-1)!)).getFile()).text();
}

export function zipBundle(files: FileMap): Uint8Array {
  return zipSync(Object.fromEntries(Object.entries(files).map(([p, c]) => [p, strToU8(c)])));
}

export function answersFromZip(bytes: Uint8Array): string {
  const entry = unzipSync(bytes)[ANSWERS_PATH];
  if (!entry) throw new Error("That zip doesn't contain a workbook answers file.");
  return strFromU8(entry);
}

export function downloadBytes(bytes: Uint8Array, name: string, type = "application/zip"): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
