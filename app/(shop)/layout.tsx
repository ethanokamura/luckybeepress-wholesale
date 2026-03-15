import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { ShopHeader } from "./shop-header";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  // Pending accounts get redirected to approval-pending page
  if (user.status === "pending" || user.status === "rejected") {
    redirect("/approval-pending");
  }

  // Suspended accounts get logged out
  if (user.status === "suspended") {
    redirect("/login");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ShopHeader signOutAction={handleSignOut} isAdmin={user.isAdmin} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{children}</div>
      </main>

      <footer className="border-t bg-secondary/40 py-8">
        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center gap-4 text-sm text-muted-foreground">
          <nav aria-label="Footer navigation" className="flex items-center gap-6">
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </nav>
          <p className="text-xs">
            Lucky Bee Press &middot; Wholesale Portal &middot;{" "}
            <a href="mailto:luckybeepress@gmail.com" className="hover:text-foreground transition-colors">
              luckybeepress@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
