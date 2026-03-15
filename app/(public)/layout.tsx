import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "./public-header";
import { getCurrentUser } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader isSignedIn={!!user} />

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-secondary/40 py-10">
        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center gap-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Lucky Bee Press" width={28} height={28} className="opacity-60" />
            <span className="font-heading text-base font-semibold text-foreground">Lucky Bee Press</span>
          </div>
          <nav aria-label="Footer navigation" className="flex items-center gap-6">
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link href="/wholesale" className="hover:text-foreground transition-colors">
              Wholesale
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </nav>
          <p className="text-xs">
            Handcrafted letterpress stationery since 2008 &middot;{" "}
            <a href="mailto:luckybeepress@gmail.com" className="hover:text-foreground transition-colors">
              luckybeepress@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
