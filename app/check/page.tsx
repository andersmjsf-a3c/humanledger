import { Checker } from "@/vault/ui/Checker";

export const metadata = { title: "Check a draft" };

export default function Check() {
  return (
    <main>
      <h1>Check a draft</h1>
      <p className="lede">
        Two checks. The first looks for the signs of AI writing that Wikipedia's editors catalogued. The second checks your own
        rules, from your worksheets and your writing-voice keep (a keep is a file your AI reads before it works for you: a standing order you own. you take it from Keelsound and add it to Claude in a few clicks). Nothing leaves this page.
      </p>
      <Checker />
    </main>
  );
}
