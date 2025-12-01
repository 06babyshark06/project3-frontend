import RoleGuard from "@/components/RoleGuard";

export default function InstructorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["instructor", "admin"]}>
      {children}
    </RoleGuard>
  );
}