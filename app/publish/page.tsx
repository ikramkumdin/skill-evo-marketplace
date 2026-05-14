import { PublishForm } from "./publish-form";

export const metadata = {
  title: "Publish a Skill — Skill Evo Marketplace",
};

export default function PublishPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Publish a Skill
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Share what you've built. Submission takes about a minute.
        </p>
      </div>

      <PublishForm />
    </div>
  );
}
