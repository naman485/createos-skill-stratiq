"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell provides sidebar + main content area.
 * Pages using AppShell should render their own Header inside.
 * Mobile menu state is managed here via a context-like approach.
 */
export const MobileMenuContext = React.createContext<{
  open: boolean;
  toggle: () => void;
  close: () => void;
}>({ open: false, toggle: () => {}, close: () => {} });

export function useMobileMenu() {
  return React.useContext(MobileMenuContext);
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const contextValue = React.useMemo(
    () => ({
      open: mobileOpen,
      toggle: () => setMobileOpen((o) => !o),
      close: () => setMobileOpen(false),
    }),
    [mobileOpen]
  );

  return (
    <MobileMenuContext.Provider value={contextValue}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </MobileMenuContext.Provider>
  );
}
