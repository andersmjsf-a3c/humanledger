import { PART_0 } from "./part0";
import type { Worksheet } from "./types";

export const WORKSHEETS: Worksheet[] = [...PART_0];

export function worksheetById(id: string): Worksheet | undefined {
  return WORKSHEETS.find((w) => w.id === id);
}
