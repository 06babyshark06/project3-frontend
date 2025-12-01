// components/RoleGuard.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Role = "student" | "instructor" | "admin";

export default function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Role[];
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role as Role)) {
    toast.error("Truy cập bị từ chối", {
      description: "Bạn không có quyền truy cập trang này.",
    });
    router.push("/dashboard");
    return null; 
  }

  return <>{children}</>;
}