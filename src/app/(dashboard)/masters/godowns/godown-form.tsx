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
import { createGodown } from "./actions";

export function GodownCreateDialog() {
  return (
    <EntityDialog triggerLabel="New Godown" title="Create Godown">
      {(close) => <GodownForm onDone={close} />}
    </EntityDialog>
  );
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function GodownForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", address: "" } });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createGodown(values);
        toast.success("Godown created");
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create godown");
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
              <FormLabel>Godown Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Thadagam Road Yard" {...field} />
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
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Create Godown"}
        </Button>
      </form>
    </Form>
  );
}
