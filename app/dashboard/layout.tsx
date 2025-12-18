// app/dashboard/layout.tsx
"use client";

import AuthGuard from "@/components/AuthGuard";
import { StudentSidebar } from "@/components/student-sidebar";
import { InstructorSidebar } from "@/components/instructor-sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { MobileNav } from "@/components/mobile-nav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const isInstructor = user?.role === "instructor" || user?.role === "admin";

    return (
        <AuthGuard>
            <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
                <div className="md:hidden p-4 border-b flex items-center bg-background">
                    <MobileNav>
                        {isInstructor ?
                            <InstructorSidebar className="block w-full h-full border-none" /> :
                            <StudentSidebar className="block w-full h-full border-none" />
                        }
                    </MobileNav>
                    <span className="ml-2 font-semibold">Menu</span>
                </div>

                {isInstructor ?
                    <InstructorSidebar className="hidden md:block h-[calc(100vh-64px)]" /> :
                    <StudentSidebar className="hidden md:block h-[calc(100vh-64px)]" />
                }
                <main className="flex-1 overflow-y-auto bg-muted/5 p-4 md:p-6">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}

