"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { UserProfile, UserRole } from "@/types/database";
import { toggleUserActive, updateUserRole } from "./actions";

export function UserRowActions({ user }: { user: UserProfile }) {
  const [isPending, startTransition] = useTransition();

  function onRoleChange(role: UserRole) {
    startTransition(async () => {
      try {
        await updateUserRole(user.id, role);
        toast.success("Role updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update role");
      }
    });
  }

  function onActiveChange(active: boolean) {
    startTransition(async () => {
      try {
        await toggleUserActive(user.id, active);
        toast.success(active ? "User activated" : "User deactivated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Select value={user.role} onValueChange={(v) => v && onRoleChange(v as UserRole)} disabled={isPending}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="owner">Owner</SelectItem>
          <SelectItem value="accountant">Accountant</SelectItem>
          <SelectItem value="sales_staff">Sales Staff</SelectItem>
        </SelectContent>
      </Select>
      <Switch checked={user.is_active} onCheckedChange={onActiveChange} disabled={isPending} />
    </div>
  );
}
