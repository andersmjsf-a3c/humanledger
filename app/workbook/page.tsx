import { WorksheetList } from "@/vault/ui/WorksheetList";

export const metadata = { title: "Workbook" };

export default function Workbook() {
  return (
    <main>
      <h1>Workbook</h1>
      <p className="lede">Do Part 0 once, then work through Part A. Everything you write stays on this device until you save it to your own folder. Your <a href="/skills">skills</a> are built next door.</p>
      <WorksheetList />
    </main>
  );
}
