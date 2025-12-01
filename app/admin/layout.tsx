// app/admin/layout.tsx
import AuthGuard from "@/components/AuthGuard";
import RoleGuard from "@/components/RoleGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["admin", "instructor"]}>
        {children}
      </RoleGuard>
    </AuthGuard>
  );
}