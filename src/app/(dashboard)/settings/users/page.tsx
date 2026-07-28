import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityDialog } from "@/components/masters/entity-dialog";
import { UserForm } from "./user-form";
import { UserRowActions } from "./user-row-actions";

export default async function UsersSettingsPage() {
  await requireRole(["owner"]);
  const supabase = await createClient();
  const { data: users } = await supabase.from("user_profiles").select("*").order("created_at");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Users</CardTitle>
        <EntityDialog triggerLabel="New User" title="Create Staff Login">
          {(close) => <UserForm onDone={close} />}
        </EntityDialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role / Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users ?? []).map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell>
                  <UserRowActions user={u} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
