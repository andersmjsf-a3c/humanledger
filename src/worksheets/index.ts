import data from "./generated/worksheets.json";
import type { Worksheet } from "./types";

export const WORKSHEETS = data as unknown as Worksheet[];

export function worksheetById(id: string): Worksheet | undefined {
  return WORKSHEETS.find((w) => w.id === id);
}
