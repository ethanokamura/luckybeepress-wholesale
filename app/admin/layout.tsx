import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar adminName={admin?.ownerName ?? admin?.email ?? "admin"} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
