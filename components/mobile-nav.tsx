"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { SheetTitle } from "@/components/ui/sheet";

interface MobileNavProps {
    children: React.ReactNode; // Content to display in the sheet (e.g., Sidebar)
}

export function MobileNav({ children }: MobileNavProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[240px]">
                <VisuallyHidden>
                    <SheetTitle>Navigation Menu</SheetTitle>
                </VisuallyHidden>
                {children}
            </SheetContent>
        </Sheet>
    );
}
