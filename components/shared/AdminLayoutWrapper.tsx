"use client";

import { DesktopAdminSidebar, MobileAdminHeader } from "./AdminSidebar";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-background">
      <DesktopAdminSidebar />

      {/* Main content area */}
      <div className="lg:pl-72">
        <MobileAdminHeader />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
