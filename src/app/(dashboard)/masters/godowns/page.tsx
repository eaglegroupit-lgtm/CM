import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EntityDialog } from "@/components/masters/entity-dialog";
import { GodownForm } from "./godown-form";

export default async function GodownsPage() {
  await requireRole(["owner", "accountant"]);
  const supabase = await createClient();
  const { data: godowns } = await supabase.from("godowns").select("*").order("name");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Godowns</CardTitle>
        <EntityDialog triggerLabel="New Godown" title="Create Godown">
          {(close) => <GodownForm onDone={close} />}
        </EntityDialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Default</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(godowns ?? []).map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell className="text-muted-foreground">{g.address ?? "—"}</TableCell>
                <TableCell>{g.is_default && <Badge variant="outline">Default</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
