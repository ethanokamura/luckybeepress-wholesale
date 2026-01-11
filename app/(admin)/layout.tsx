"use client";

import { AdminLayoutWrapper } from "@/components/shared/AdminLayoutWrapper";
import { AuthGuard } from "@/components/shared/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth requireAdmin>
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </AuthGuard>
  );
}
