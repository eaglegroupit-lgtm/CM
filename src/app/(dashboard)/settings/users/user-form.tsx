"use client";

import { useState, useTransition } from "react";
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
import { createStaffUser } from "./actions";

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(["owner", "accountant", "sales_staff"]),
});

type FormValues = z.infer<typeof schema>;

export function UserForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "", role: "sales_staff" },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createStaffUser(values);
        toast.success("User created");
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create user");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField control={form.control} name="full_name" render={({ field }) => (
          <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Temporary Password</FormLabel>
            <FormControl>
              <Input type={showPassword ? "text" : "password"} {...field} />
            </FormControl>
            <button type="button" className="text-xs text-muted-foreground text-left" onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? "Hide" : "Show"} password
            </button>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="sales_staff">Sales Staff</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create User"}
        </Button>
      </form>
    </Form>
  );
}
