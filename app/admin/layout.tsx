
"use client";

import AuthGuard from "@/components/AuthGuard";
import RoleGuard from "@/components/RoleGuard";
import { AdminSidebar } from "@/components/admin-sidebar";
import { MobileNav } from "@/components/mobile-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["admin"]}>
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
          {}
          <div className="md:hidden p-4 border-b flex items-center">
            <MobileNav>
              <AdminSidebar className="block w-full h-full border-none" />
            </MobileNav>
            <span className="ml-2 font-semibold">Admin Menu</span>
          </div>

          {}
          <AdminSidebar className="hidden md:block h-[calc(100vh-64px)]" />

          <main className="flex-1 overflow-y-auto bg-muted/5 p-4 md:p-6">
            {children}
          </main>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
