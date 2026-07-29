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
import { EntityDialog } from "@/components/masters/entity-dialog";
import { createSupplier } from "./actions";

export function SupplierCreateDialog() {
  return (
    <EntityDialog triggerLabel="New Supplier" title="Create Supplier">
      {(close) => <SupplierForm onDone={close} />}
    </EntityDialog>
  );
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  gstin: z.string().optional(),
  credit_limit: z.coerce.number().optional(),
  credit_days: z.coerce.number().optional(),
  opening_balance: z.coerce.number().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function SupplierForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", address: "", state: "Rajasthan", gstin: "" },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createSupplier(values);
        toast.success("Supplier created");
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create supplier");
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
              <FormLabel>Supplier / Company Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Rajasthan Marble Quarries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
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
          <FormField
            control={form.control}
            name="gstin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GSTIN (if registered)</FormLabel>
                <FormControl>
                  <Input placeholder="08ABCDE1234F1Z5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
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
          {isPending ? "Saving..." : "Create Supplier"}
        </Button>
      </form>
    </Form>
  );
}
