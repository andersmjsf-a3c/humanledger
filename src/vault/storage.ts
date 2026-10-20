// Local-first storage for worksheet answers (Mark, Oct 20 2026). Week 2 fills this in:
// IndexedDB autosave, "Save to my folder" (File System Access API, zip fallback), and
// "Open from my folder". Nothing here may touch the network.

export type WorksheetId = string;

export interface AnswerStore {
  save(worksheet: WorksheetId, answers: Record<string, string>): Promise<void>;
  load(worksheet: WorksheetId): Promise<Record<string, string> | null>;
  unsavedToFolder(): Promise<WorksheetId[]>;
}
