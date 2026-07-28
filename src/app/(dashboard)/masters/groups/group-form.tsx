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
import type { AccountGroup } from "@/types/database";
import { createGroup } from "./actions";

const NATURES = ["asset", "liability", "income", "expense", "equity"] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  parent_group_id: z.string().optional(),
  nature: z.enum(NATURES),
  normal_balance: z.enum(["debit", "credit"]),
});

type FormValues = z.infer<typeof schema>;

export function GroupForm({ groups, onDone }: { groups: AccountGroup[]; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", parent_group_id: "", nature: "asset", normal_balance: "debit" },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createGroup({
          name: values.name,
          parent_group_id: values.parent_group_id || null,
          nature: values.nature,
          normal_balance: values.normal_balance,
        });
        toast.success("Group created");
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create group");
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
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Marble Traders" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parent_group_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Under (parent group)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None (primary group)" />
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nature</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NATURES.map((n) => (
                      <SelectItem key={n} value={n} className="capitalize">
                        {n}
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
            name="normal_balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Normal Balance</FormLabel>
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
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Create Group"}
        </Button>
      </form>
    </Form>
  );
}
