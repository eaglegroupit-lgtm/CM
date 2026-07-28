"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Building2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { NavGroup } from "@/lib/nav-config";
import type { UserProfile } from "@/types/database";
import { signOut } from "@/app/(dashboard)/actions";

const ROLE_LABEL: Record<UserProfile["role"], string> = {
  owner: "Owner",
  accountant: "Accountant",
  sales_staff: "Sales Staff",
};

export function AppSidebar({ navGroups, profile }: { navGroups: NavGroup[]; profile: UserProfile }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Building2 className="size-5 shrink-0 text-primary" />
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">Kovai Marbles &amp; Granites</span>
            <span className="truncate text-xs text-muted-foreground">Accounts &amp; Inventory</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.url)}
                      render={
                        <Link href={item.url}>
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 group-data-[collapsible=icon]:flex-col">
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{profile.full_name}</span>
            <span className="truncate text-xs text-muted-foreground">{ROLE_LABEL[profile.role]}</span>
          </div>
          <form action={signOut}>
            <Button variant="ghost" size="icon" type="submit" title="Sign out">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
