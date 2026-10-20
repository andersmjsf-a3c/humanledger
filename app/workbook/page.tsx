import { WorksheetList } from "@/vault/ui/WorksheetList";

export const metadata = { title: "Workbook" };

export default function Workbook() {
  return (
    <main>
      <h1>Workbook</h1>
      <p className="lede">Part 0: set up. Do these once, before Part A.</p>
      <WorksheetList />
    </main>
  );
}
