"use client";
import { useState } from "react";
import { OfflineNotice } from "@/components/offline-notice";
import { Nav } from "@/components/nav";
export function AppShell({ children, username }: { children: React.ReactNode; username: string }) {
  const [collapsed, setCollapsed] = useState(false);
  return <div className="app-shell" data-collapsed={collapsed}><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn-primary">Skip to content</a><Nav username={username} collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)}/><main id="main-content" className="shell-main"><OfflineNotice/>{children}</main></div>;
}
