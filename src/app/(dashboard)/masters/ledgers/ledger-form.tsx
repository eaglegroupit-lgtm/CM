"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntityDialog } from "@/components/masters/entity-dialog";
import type { AccountGroup } from "@/types/database";
import { createLedger } from "./actions";

export function LedgerCreateDialog({ groups }: { groups: AccountGroup[] }) {
  return (
    <EntityDialog triggerLabel="New Ledger" title="Create Ledger">
      {(close) => <LedgerForm groups={groups} onDone={close} />}
    </EntityDialog>
  );
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  group_id: z.string().min(1, "Select a group"),
  opening_balance: z.coerce.number().default(0),
  opening_balance_type: z.enum(["debit", "credit"]),
  party_type: z.enum(["debtor", "creditor", "both", "none"]),
  gstin: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  credit_limit: z.coerce.number().optional(),
  credit_days: z.coerce.number().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function LedgerForm({ groups, onDone }: { groups: AccountGroup[]; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      group_id: "",
      opening_balance: 0,
      opening_balance_type: "debit",
      party_type: "none",
      gstin: "",
      address: "",
      state: "Tamil Nadu",
      phone: "",
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createLedger(values);
        toast.success("Ledger created");
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create ledger");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ledger Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Sri Balaji Granites" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="group_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Under Group</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="party_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="debtor">Debtor (Customer)</SelectItem>
                  <SelectItem value="creditor">Creditor (Supplier)</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="opening_balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Balance</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} value={(field.value as number | string | undefined) ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="opening_balance_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dr / Cr</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="gstin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GSTIN (if applicable)</FormLabel>
              <FormControl>
                <Input placeholder="33ABCDE1234F1Z5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="Tamil Nadu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="credit_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Limit (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} value={(field.value as number | string | undefined) ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="credit_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Days</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={(field.value as number | string | undefined) ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Create Ledger"}
        </Button>
      </form>
    </Form>
  );
}
