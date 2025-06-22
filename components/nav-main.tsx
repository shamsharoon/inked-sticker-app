"use client";

import { PlusCircleIcon, type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import { GradientButton } from "@/components/ui/gradient-button";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <GradientButton
              asChild
              className="flex-1 justify-start min-w-0 whitespace-nowrap text-sm px-4 py-2 h-9"
            >
              <a
                href="/app/create"
                className="flex items-center justify-start gap-2"
              >
                <PlusCircleIcon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Create Order</span>
              </a>
            </GradientButton>
            <div className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0">
              <ModeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
