// app/admin/layout.tsx
"use client";

import AuthGuard from "@/components/AuthGuard";
import RoleGuard from "@/components/RoleGuard";
import { AdminSidebar } from "@/components/admin-sidebar";
import { InstructorSidebar } from "@/components/instructor-sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { MobileNav } from "@/components/mobile-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const isInstructor = user?.role === "instructor";

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["admin", "instructor"]}>
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
          {/* Mobile Navigation Trigger */}
          <div className="md:hidden p-4 border-b flex items-center">
            <MobileNav>
              {isInstructor ? <InstructorSidebar className="block w-full h-full border-none" /> : <AdminSidebar className="block w-full h-full border-none" />}
            </MobileNav>
            <span className="ml-2 font-semibold">Menu</span>
          </div>

          {/* Desktop Sidebar */}
          {isInstructor ? <InstructorSidebar className="hidden md:block h-[calc(100vh-64px)]" /> : <AdminSidebar className="hidden md:block h-[calc(100vh-64px)]" />}

          <main className="flex-1 overflow-y-auto bg-muted/5 p-4 md:p-6">
            {children}
          </main>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
