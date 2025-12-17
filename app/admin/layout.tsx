// app/admin/layout.tsx
"use client";

import AuthGuard from "@/components/AuthGuard";
import RoleGuard from "@/components/RoleGuard";
import { AdminSidebar } from "@/components/admin-sidebar";
import { InstructorSidebar } from "@/components/instructor-sidebar";
import { useAuth } from "@/contexts/AuthContext";

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
        <div className="flex min-h-[calc(100vh-64px)]"> {/* 64px is header height */}
          {isInstructor ? <InstructorSidebar /> : <AdminSidebar />}
          <main className="flex-1 overflow-y-auto bg-muted/5 p-6">
            {children}
          </main>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
