import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { SharedList } from "./SharedList";

export const dynamic = "force-dynamic";

export default async function SharedPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      {await Header()}
      <main className="mx-auto max-w-3xl px-5 py-8">
        <SharedList />
      </main>
    </>
  );
}
