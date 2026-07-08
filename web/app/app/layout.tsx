import { redirect } from "next/navigation";
import { sessionUser } from "@/lib/server/session";
import { ProductNav } from "@/components/product/product-nav";

export const dynamic = "force-dynamic";

/** Session gate + shell for everything under /app. */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await sessionUser().catch(() => null);
  if (!user) redirect("/?auth=required");

  return (
    <div className="min-h-dvh">
      <ProductNav
        user={{ anilistName: user.anilistName, avatarUrl: user.avatarUrl }}
      />
      <main className="mx-auto w-full max-w-[860px] px-4 pb-24 pt-28 sm:px-6">
        {children}
      </main>
    </div>
  );
}
