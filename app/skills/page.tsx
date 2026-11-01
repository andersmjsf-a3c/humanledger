import { SkillList } from "@/vault/ui/SkillList";

export const metadata = { title: "Keeps" };

export default function Skills() {
  return (
    <main>
      <h1>Keeps</h1>
      <p className="lede">
        A keep is a file your AI reads before it works for you: a standing order you own. Claude calls them skills. Write one once for a job you do repeatedly, so next time you just name the job. Fill one in,
        download it, and give it to your AI. A keep is never finished: every correction you&apos;d otherwise repeat goes back into it.
      </p>
      <SkillList />
    </main>
  );
}
