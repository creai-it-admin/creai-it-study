import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { InclassForm } from "./InclassForm";

export const dynamic = "force-dynamic";

export default async function InclassPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      {await Header()}
      <main className="mx-auto max-w-3xl px-5 py-8">
        <InclassForm />
      </main>
    </>
  );
}
