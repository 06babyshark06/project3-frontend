// app/dashboard/layout.tsx
"use client";

import AuthGuard from "@/components/AuthGuard";
import { StudentSidebar } from "@/components/student-sidebar";
import { InstructorSidebar } from "@/components/instructor-sidebar";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const isInstructor = user?.role === "instructor" || user?.role === "admin";

    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)]">
                {isInstructor ? <InstructorSidebar /> : <StudentSidebar />}
                <main className="flex-1 overflow-y-auto bg-muted/5 p-6">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}

