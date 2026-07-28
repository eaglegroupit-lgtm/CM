"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { CompanySettings } from "@/types/database";
import { updateCompanySettings } from "./actions";

const schema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  state_code: z.string().min(1),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_no: z.string().optional(),
  bank_ifsc: z.string().optional(),
  bank_branch: z.string().optional(),
  invoice_terms: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CompanyForm({ company }: { company: CompanySettings }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: company.name,
      address: company.address,
      city: company.city,
      state: company.state,
      state_code: company.state_code,
      pincode: company.pincode ?? "",
      phone: company.phone ?? "",
      email: company.email ?? "",
      gstin: company.gstin ?? "",
      pan: company.pan ?? "",
      bank_name: company.bank_name ?? "",
      bank_account_no: company.bank_account_no ?? "",
      bank_ifsc: company.bank_ifsc ?? "",
      bank_branch: company.bank_branch ?? "",
      invoice_terms: company.invoice_terms ?? "",
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await updateCompanySettings(values);
        toast.success("Company settings updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 max-w-2xl">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="state" render={({ field }) => (
            <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="pincode" render={({ field }) => (
            <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="gstin" render={({ field }) => (
            <FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="pan" render={({ field }) => (
            <FormItem><FormLabel>PAN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="state_code" render={({ field }) => (
            <FormItem><FormLabel>GST State Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <p className="text-sm font-medium text-muted-foreground mt-2">Bank Details (printed on invoices)</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="bank_name" render={({ field }) => (
            <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="bank_account_no" render={({ field }) => (
            <FormItem><FormLabel>Account No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="bank_ifsc" render={({ field }) => (
            <FormItem><FormLabel>IFSC</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="bank_branch" render={({ field }) => (
            <FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="invoice_terms" render={({ field }) => (
          <FormItem><FormLabel>Invoice Terms &amp; Conditions</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? "Saving..." : "Save Company Settings"}
        </Button>
      </form>
    </Form>
  );
}
