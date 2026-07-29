import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GroupCreateDialog } from "./group-form";

export default async function GroupsPage() {
  await requireRole(["owner", "accountant"]);
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("account_groups")
    .select("*")
    .order("name");

  const all = groups ?? [];
  const byId = new Map(all.map((g) => [g.id, g]));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Account Groups</CardTitle>
        <GroupCreateDialog groups={all} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Under</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Normal Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {all.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {g.parent_group_id ? byId.get(g.parent_group_id)?.name : "—"}
                </TableCell>
                <TableCell className="capitalize">{g.nature}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {g.normal_balance}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
