"use client";

import AuthGuard from "@/components/AuthGuard";
import RoleGuard from "@/components/RoleGuard";
import { InstructorSidebar } from "@/components/instructor-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationListener } from "@/components/NotificationListener";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["admin", "instructor"]}>
        <NotificationListener />
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
          {/* Mobile Navigation Trigger */}
          <div className="md:hidden p-4 border-b flex items-center">
            <MobileNav>
              <InstructorSidebar className="block w-full h-full border-none" />
            </MobileNav>
            <span className="ml-2 font-semibold">Instructor Menu</span>
          </div>

          {/* Desktop Sidebar */}
          <InstructorSidebar className="hidden md:block h-[calc(100vh-64px)]" />

          <main className="flex-1 overflow-y-auto bg-muted/5 p-4 md:p-6">
            {children}
          </main>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
