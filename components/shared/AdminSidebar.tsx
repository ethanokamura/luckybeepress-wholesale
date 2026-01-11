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
  Home,
  ShoppingBag,
  ClipboardList,
  Phone,
  ShoppingCart,
  Menu,
  LogOut,
  User,
  LineChart,
  Package,
  Mail,
  Users,
} from "lucide-react";

interface AdminSidebarContentProps {
  onNavigate?: () => void;
}

function AdminSidebarContent({ onNavigate }: AdminSidebarContentProps) {
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
    return pathname === href;
  };

  const adminNavItems = [
    { href: "/admin", label: "Dashboard", icon: LineChart },
    { href: "/admin/orders", label: "Orders", icon: Package },
    { href: "/admin/products", label: "Products", icon: Mail },
    { href: "/admin/customers", label: "Customers", icon: Users },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-4">
        <Link
          href="/products"
          className="flex items-center gap-3"
          onClick={handleNavClick}
        >
          <Image src="/logo.svg" alt="Lucky Bee Press" width={36} height={36} />
          <span className="text-lg font-bold text-sidebar-foreground">
            ← Back to shop
          </span>
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {/* Admin link */}
        {mounted && isAdmin && (
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
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
                  </Link>
                </li>
              );
            })}
          </ul>
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
export function DesktopAdminSidebar() {
  return (
    <aside className="hidden lg:flex fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border flex-col">
      <AdminSidebarContent />
    </aside>
  );
}

// Mobile sidebar (sheet/drawer)
export function MobileAdminSidebar() {
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
        <AdminSidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Mobile header component
export function MobileAdminHeader() {
  return (
    <header className="sticky top-0 z-40 lg:hidden flex items-center h-14 px-4 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
      <MobileAdminSidebar />
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
