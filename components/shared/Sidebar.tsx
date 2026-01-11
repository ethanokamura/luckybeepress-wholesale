"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onSnapshot, query, where, limit } from "firebase/firestore";
import { collections } from "@/lib/firebase-helpers";
import type { Cart } from "@/types";
import {
  ShoppingBag,
  ClipboardList,
  Phone,
  ShoppingCart,
  Settings,
  Menu,
  LogOut,
  User,
} from "lucide-react";

interface SidebarContentProps {
  onNavigate?: () => void;
}

function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const { firebaseUser, userData, loading, isApproved, isAdmin, mounted } =
    useAuth();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);

  const isLoading = !mounted || loading;

  useEffect(() => {
    if (!firebaseUser) {
      return;
    }

    const q = query(
      collections.carts,
      where("userId", "==", firebaseUser.uid),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const cart = snapshot.docs[0].data() as Cart;
        setCartCount(cart.itemCount || 0);
      } else {
        setCartCount(0);
      }
    });

    return () => {
      unsubscribe();
      setCartCount(0);
    };
  }, [firebaseUser]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
    onNavigate?.();
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navItems = [
    {
      href: "/products",
      label: "Catalog",
      icon: ShoppingBag,
      requiresApproval: true,
    },
    {
      href: "/cart",
      label: "Cart",
      icon: ShoppingCart,
      requiresApproval: true,
    },
    {
      href: "/orders",
      label: "Orders",
      icon: ClipboardList,
      requiresApproval: true,
    },
    {
      href: "/contact",
      label: "Contact",
      icon: Phone,
      requiresApproval: false,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex gap-3 items-center h-16 px-4">
        <Image src="/logo.svg" alt="Lucky Bee Press" width={36} height={36} />
        <span className="text-lg font-bold text-sidebar-foreground">
          LuckyBeePress
        </span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            if (item.requiresApproval && !isApproved) return null;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-primary ${
                    active
                      ? "bg-sidebar-primary/50 text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:text-sidebar-primary-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.label}
                  {item.label === "Cart" && cartCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin link */}
        {mounted && isAdmin && (
          <div className="mt-4 pt-4 border-t border-sidebar-border">
            <Link
              href="/admin"
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-primary ${
                isActive("/admin")
                  ? "bg-sidebar-primary/50 text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:text-sidebar-primary-foreground"
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        {isLoading ? (
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        ) : firebaseUser ? (
          <div className="space-y-3">
            <Link
              href="/account"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userData?.displayName || "Account"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {firebaseUser.email}
                </p>
              </div>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link href="/login" onClick={handleNavClick}>
              <Button variant="outline" size="sm" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" onClick={handleNavClick}>
              <Button size="sm" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Desktop sidebar (always visible)
export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border flex-col">
      <SidebarContent />
    </aside>
  );
}

// Mobile sidebar (sheet/drawer)
export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Mobile header component
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 lg:hidden flex items-center h-14 px-4 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
      <MobileSidebar />
      <Link href="/" className="flex items-center gap-2 ml-3">
        <Image
          src="/logo-light.svg"
          alt="Lucky Bee Press"
          width={28}
          height={28}
        />
        <span className="font-bold text-foreground">LuckyBeePress</span>
      </Link>
    </header>
  );
}
