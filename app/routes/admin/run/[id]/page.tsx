import { RunConsole } from "./RunConsole";

export const dynamic = "force-dynamic";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <RunConsole id={id} />
    </main>
  );
}
