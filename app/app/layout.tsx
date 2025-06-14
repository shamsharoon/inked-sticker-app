import type React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset className="flex-grow overflow-hidden">
          <SiteHeader />
          <main className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
