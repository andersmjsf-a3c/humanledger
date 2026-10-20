import { SkillList } from "@/vault/ui/SkillList";

export const metadata = { title: "Skills" };

export default function Skills() {
  return (
    <main>
      <h1>Skills</h1>
      <p className="lede">
        Instructions you write once for a job you do repeatedly, so next time you just name the job. Fill one in, download it,
        and give it to your AI. A skill is never finished: every correction you'd otherwise repeat goes back into it.
      </p>
      <SkillList />
    </main>
  );
}
