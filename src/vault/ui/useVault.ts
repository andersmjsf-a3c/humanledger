"use client";
import { useCallback, useEffect, useState } from "react";
import { AnswerStore } from "../storage";
import { buildBundle, bumpVersions, parseBundle } from "../bundle";
import { answersFromZip, canWriteFolders, downloadBytes, pickFolder, readAnswersFromFolder, writeToFolder, zipBundle } from "../folder";

let store: AnswerStore | undefined;
export function getStore() {
  return (store ??= new AnswerStore());
}

// Shared folder state for the workbook pages: what's unsaved, and the two folder actions.
export function useVault() {
  const [unsaved, setUnsaved] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");

  const refresh = useCallback(async () => setUnsaved(await getStore().unsavedToFolder()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // A reminder before leaving when answers exist only in this browser.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (unsaved.length) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved.length]);

  const saveToFolder = useCallback(async () => {
    const s = getStore();
    let records = await s.all();
    if (!records.length) return setMessage("Nothing to save yet.");
    const bumped = bumpVersions(records);
    if (bumped.length) {
      await s.replaceAll(bumped);
      records = await s.all();
    }
    const files = buildBundle(records);
    try {
      if (canWriteFolders()) {
        let dir = await s.getFolderHandle<any>();
        if (!dir) {
          dir = await pickFolder();
          await s.setFolderHandle(dir);
        }
        await writeToFolder(dir, files);
        setMessage(`Saved to your folder "${dir.name}".`);
      } else {
        downloadBytes(zipBundle(files), "workbook.zip");
        setMessage("Downloaded workbook.zip. Keep it in a folder you back up.");
      }
      await s.markSavedToFolder(records.map((r) => r.id));
      await refresh();
    } catch (e: any) {
      if (e?.name !== "AbortError") setMessage(e?.message ?? "Couldn't save to your folder.");
    }
  }, [refresh]);

  const changeFolder = useCallback(async () => {
    try {
      await getStore().setFolderHandle(await pickFolder());
      setMessage("Folder changed. Your next save goes there.");
    } catch (e: any) {
      if (e?.name !== "AbortError") setMessage(e?.message ?? "Couldn't change the folder.");
    }
  }, []);

  const importText = useCallback(
    async (text: string) => {
      const { records, skipped } = parseBundle(text);
      await getStore().replaceAll(records);
      await refresh();
      setMessage(`Opened ${records.length} worksheet${records.length === 1 ? "" : "s"}${skipped ? ` (${skipped} unknown entries skipped)` : ""}.`);
    },
    [refresh],
  );

  const openFromFolder = useCallback(async () => {
    try {
      if (canWriteFolders()) {
        const dir = await pickFolder();
        await importText(await readAnswersFromFolder(dir));
        await getStore().setFolderHandle(dir);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setMessage(e?.message ?? "Couldn't open that folder.");
    }
  }, [importText]);

  const openFromFile = useCallback(
    async (file: File) => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        await importText(file.name.endsWith(".zip") ? answersFromZip(bytes) : new TextDecoder().decode(bytes));
      } catch (e: any) {
        setMessage(e?.message ?? "Couldn't open that file.");
      }
    },
    [importText],
  );

  return { unsaved, message, refresh, saveToFolder, changeFolder, openFromFolder, openFromFile, canWriteFolders };
}
