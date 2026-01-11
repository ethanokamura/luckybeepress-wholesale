"use client";

import { DesktopSidebar, MobileHeader } from "./Sidebar";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      
      {/* Main content area */}
      <div className="lg:pl-72">
        <MobileHeader />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
