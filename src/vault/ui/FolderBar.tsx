"use client";
import { useVault } from "./useVault";

export function FolderBar({ vault }: { vault: ReturnType<typeof useVault> }) {
  const { unsaved, message, saveToFolder, changeFolder, openFromFolder, openFromFile, canWriteFolders } = vault;
  const folders = canWriteFolders();
  return (
    <section className="folderbar" aria-live="polite">
      <p className="status">
        {unsaved.length ? (
          <>
            <span className="dot" aria-hidden /> {unsaved.length} worksheet{unsaved.length === 1 ? "" : "s"} saved on this
            device only, not yet in your folder.
          </>
        ) : (
          <>Everything is saved on this device and in your folder.</>
        )}
      </p>
      <div className="actions">
        <button onClick={saveToFolder} className="primary">
          {folders ? "Save to my folder" : "Download to keep"}
        </button>
        {folders ? (
          <>
            <button onClick={openFromFolder}>Open from my folder</button>
            <button onClick={changeFolder} className="quiet">Change folder</button>
          </>
        ) : (
          <label className="filebutton">
            Open a saved file
            <input type="file" accept=".zip,.json" onChange={(e) => e.target.files?.[0] && openFromFile(e.target.files[0])} />
          </label>
        )}
      </div>
      {message && <p className="message">{message}</p>}
      <p className="fineprint">
        Your answers never leave your device unless you save them to a folder you choose. Pick a folder inside Dropbox,
        iCloud Drive, or Google Drive and your own cloud keeps a copy for your other devices.
      </p>
    </section>
  );
}
