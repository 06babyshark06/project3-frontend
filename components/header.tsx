// components/header.tsx
"use client"; // Header CẦN là client component

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { UserNav } from "./user-nav"; // Component mới
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, isLoading } = useAuth();

  const renderNav = () => {
    if (isLoading) {
      return <div className="w-24 h-20" />;
    }

    if (user) {
      return <UserNav />;
    }

    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" asChild size="lg" className="text-lg">
          <Link href="/login">Đăng nhập</Link>
        </Button>
        <Button asChild size="lg" className="text-lg">
          <Link href="/register">Đăng ký</Link>
        </Button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="text-4xl font-bold text-primary mx-8">
          JQK Study
        </Link>

        <div className="flex items-center gap-4">
          <ModeToggle />
          {renderNav()}
        </div>
      </div>
    </header>
  );
}