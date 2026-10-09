"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Boxes,
  CircleHelp,
  Clock,
  FileUser,
  HandCoins,
  Hammer,
  House,
  Landmark,
  LogOut,
  Package,
  ReceiptText,
  Redo2,
  Scale,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
  Undo2,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
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
import type { NavGroup, NavIcon } from "@/lib/nav-config";
import type { UserProfile } from "@/types/database";
import { signOut } from "@/app/(dashboard)/actions";

const ROLE_LABEL: Record<UserProfile["role"], string> = {
  owner: "Owner",
  accountant: "Accountant",
  sales_staff: "Sales Staff",
};

const ICONS: Record<NavIcon, LucideIcon> = {
  home: House,
  sale: ReceiptText,
  purchase: ShoppingCart,
  "money-in": HandCoins,
  "money-out": Wallet,
  "sale-return": Undo2,
  "purchase-return": Redo2,
  items: Package,
  customers: Users,
  suppliers: Truck,
  accounts: Landmark,
  "day-book": BookOpen,
  statement: FileUser,
  stock: Boxes,
  pending: Clock,
  profit: TrendingUp,
  "balance-sheet": Scale,
  shop: Store,
  users: UserCog,
  guide: CircleHelp,
};

export function AppSidebar({
  navGroups,
  profile,
  shopName,
}: {
  navGroups: NavGroup[];
  profile: UserProfile;
  shopName: string;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Hammer className="size-5 shrink-0 text-primary" />
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">{shopName}</span>
            <span className="truncate text-xs text-muted-foreground">Billing, Stock &amp; Accounts</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = ICONS[item.icon];
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.url)}
                        tooltip={item.title}
                        render={
                          <Link href={item.url} {...(item.external ? { target: "_blank", rel: "noopener" } : {})}>
                            <Icon />
                            <span>{item.title}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  );
                })}
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
