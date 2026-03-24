"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  Package,
  FolderTree,
  Receipt,
  BarChart3,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
];

const catalogNavItems = [
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
];

const financeNavItems = [
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

const systemNavItems = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function NavSection({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <>
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary-text shadow-sm"
                : "hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/30 p-4 flex flex-col gap-1">
      <div className="mb-6 px-3">
        <div className="flex items-center gap-2">
          {/* <Image src="/logo.svg" alt="Lucky Bee Press" width={28} height={28} /> */}
          <h2 className="text-lg font-semibold">Lucky Bee Press</h2>
        </div>
        <p className="text-sm text-muted-foreground">Admin Dashboard</p>
      </div>

      <nav aria-label="Admin navigation" className="flex flex-col gap-1">
        <NavSection items={mainNavItems} pathname={pathname} />
        <Separator className="my-2" />
        <NavSection items={catalogNavItems} pathname={pathname} />
        <Separator className="my-2" />
        <NavSection items={financeNavItems} pathname={pathname} />
        <Separator className="my-2" />
        <NavSection items={systemNavItems} pathname={pathname} />
      </nav>

      <div className="mt-auto flex flex-col gap-2 px-3 py-2">
        <Link
          href="/catalog"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="size-4" />
          View Store
        </Link>
        <p className="text-xs text-muted-foreground">
          Signed in as {adminName}
        </p>
      </div>
    </aside>
  );
}
