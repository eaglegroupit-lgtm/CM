import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function DateRangeForm({
  action,
  from,
  to,
  asOf,
}: {
  action: string;
  from?: string;
  to?: string;
  asOf?: string;
}) {
  return (
    <form action={action} method="get" className="flex flex-wrap items-end gap-3">
      {asOf !== undefined ? (
        <div className="grid gap-1.5">
          <Label htmlFor="as_of">As of</Label>
          <Input id="as_of" type="date" name="as_of" defaultValue={asOf} />
        </div>
      ) : (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" name="from" defaultValue={from} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" name="to" defaultValue={to} />
          </div>
        </>
      )}
      <Button type="submit">Apply</Button>
    </form>
  );
}
