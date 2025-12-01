// components/user-nav.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

export function UserNav() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    toast.success("Đăng xuất thành công!");
    router.push("/login");
  };

  const fallback = user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {/* <AvatarImage src="/path-to-user-image.png" alt={user.name} /> */}
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {fallback}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user.role === "admin" && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/admin/dashboard">Dashboard (Quản lý)</Link>
            </DropdownMenuItem>
          )}
          {(user.role === "instructor" || user.role === "admin") && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/instructor">Dashboard (Giáo viện)</Link>
            </DropdownMenuItem>
          )}

          {(user.role === "student" || user.role === "instructor" || user.role === "admin") && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard">Dashboard (Học viên)</Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/profile">Cài đặt tài khoản</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}