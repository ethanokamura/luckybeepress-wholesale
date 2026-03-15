"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicHeader({ isSignedIn }: { isSignedIn: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Image
            src="/logo.svg"
            alt="Lucky Bee Press"
            width={32}
            height={32}
          />
          Lucky Bee Press
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-4"
        >
          <Link
            href="/wholesale"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Wholesale Program
          </Link>
          {isSignedIn ? (
            <Button asChild size="sm">
              <Link href="/catalog">Browse Catalog</Link>
            </Button>
          ) : (
            <>
              <Link
                href="/apply"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Apply
              </Link>
              <Button asChild size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="mobile-menu-enter md:hidden border-t bg-background"
        >
          <div className="mx-auto max-w-7xl flex flex-col gap-1 px-4 py-3">
            <Link
              href="/wholesale"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Wholesale Program
            </Link>
            {isSignedIn ? (
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Browse Catalog
              </Link>
            ) : (
              <>
                <Link
                  href="/apply"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Apply
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
