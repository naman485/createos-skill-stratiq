"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/components/layout/app-shell";

interface HeaderProps {
  title: string;
  description?: string;
  onMobileMenuToggle?: () => void;
  children?: React.ReactNode;
}

export function Header({
  title,
  description,
  onMobileMenuToggle,
  children,
}: HeaderProps) {
  const mobileMenu = useMobileMenu();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onMobileMenuToggle ?? mobileMenu.toggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
