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
  FormDescription,
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
import type { StockCategory, UnitOfMeasure } from "@/types/database";
import { createStockItem } from "./actions";

const GST_RATES = [0, 5, 12, 18, 28];

export function StockItemCreateDialog({
  categories,
  units,
}: {
  categories: StockCategory[];
  units: UnitOfMeasure[];
}) {
  return (
    <EntityDialog triggerLabel="New Item" title="Add Item">
      {(close) => <StockItemForm categories={categories} units={units} onDone={close} />}
    </EntityDialog>
  );
}

const optionalNumber = z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().min(0).optional());

const schema = z.object({
  name: z.string().min(1, "Item name is required"),
  category_id: z.string().min(1, "Select a category"),
  unit_id: z.string().min(1, "Select a unit"),
  brand: z.string().optional(),
  size: z.string().optional(),
  thickness_mm: optionalNumber,
  hsn_code: z.string().optional(),
  gst_rate: z.coerce.number().min(0).max(100),
  standard_rate: z.coerce.number().min(0),
  purchase_rate: z.coerce.number().min(0),
  opening_qty: z.coerce.number().min(0),
  low_stock_qty: z.coerce.number().min(0),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function StockItemForm({
  categories,
  units,
  onDone,
}: {
  categories: StockCategory[];
  units: UnitOfMeasure[];
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category_id: "",
      unit_id: units.find((u) => u.name === "Nos")?.id ?? "",
      brand: "",
      size: "",
      thickness_mm: "",
      hsn_code: "",
      gst_rate: 18,
      standard_rate: 0,
      purchase_rate: 0,
      opening_qty: 0,
      low_stock_qty: 0,
    },
  });

  const numberField = (field: { value: unknown }) => ({ value: (field.value as number | string | undefined) ?? "" });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createStockItem(values);
        toast.success("Item added");
        form.reset();
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add item");
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
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. BWP Marine Plywood / SS Butt Hinge 4 inch" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category">
                        {(v: string) => categories.find((c) => c.id === v)?.name ?? ""}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
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
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sold in (unit)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select unit">
                        {(v: string) => units.find((u) => u.id === v)?.name ?? ""}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Greenply" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size</FormLabel>
                <FormControl>
                  <Input placeholder="8x4 ft / 4 inch" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="thickness_mm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thickness (mm)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="18" {...field} {...numberField(field)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="standard_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} {...numberField(field)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchase_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} {...numberField(field)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gst_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST</FormLabel>
                <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: string) => `${v}%`}</SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GST_RATES.map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        {r}%
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
            name="hsn_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HSN Code</FormLabel>
                <FormControl>
                  <Input placeholder="Optional, e.g. 4412" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="opening_qty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock in hand now</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} {...numberField(field)} />
                </FormControl>
                <FormDescription>Valued at the purchase price.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="low_stock_qty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warn when stock below</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} {...numberField(field)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Add Item"}
        </Button>
      </form>
    </Form>
  );
}
