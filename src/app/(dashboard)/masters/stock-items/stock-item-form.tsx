"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { StockCategory, UnitOfMeasure } from "@/types/database";
import { createStockItem } from "./actions";

export function StockItemCreateDialog({
  categories,
  units,
}: {
  categories: StockCategory[];
  units: UnitOfMeasure[];
}) {
  return (
    <EntityDialog triggerLabel="New Item" title="Create Stock Item">
      {(close) => <StockItemForm categories={categories} units={units} onDone={close} />}
    </EntityDialog>
  );
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category_id: z.string().min(1, "Select a category"),
  item_type: z.enum(["slab", "tile", "quartz", "simple"]),
  unit_id: z.string().min(1, "Select a unit"),
  hsn_code: z.string().optional(),
  gst_rate: z.coerce.number().min(0).max(100).default(18),
  standard_rate: z.coerce.number().min(0).default(0),
  low_stock_qty: z.coerce.number().min(0).default(0),
  tracks_lots: z.boolean().default(false),
  thickness_mm: z.coerce.number().optional(),
  finish: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  brand: z.string().optional(),
  opening_qty: z.coerce.number().min(0).default(0),
  opening_value: z.coerce.number().min(0).default(0),
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
      item_type: "slab",
      unit_id: "",
      hsn_code: "6802",
      gst_rate: 18,
      standard_rate: 0,
      low_stock_qty: 0,
      tracks_lots: true,
      opening_qty: 0,
      opening_value: 0,
    },
  });

  const itemType = form.watch("item_type");

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createStockItem(values);
        toast.success("Stock item created");
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create stock item");
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
                <Input placeholder="e.g. Tan Brown Granite" {...field} />
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
                      <SelectValue placeholder="Select category" />
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
            name="item_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="slab">Slab (Marble/Granite)</SelectItem>
                    <SelectItem value="tile">Tile</SelectItem>
                    <SelectItem value="quartz">Quartz</SelectItem>
                    <SelectItem value="simple">Simple (qty + unit)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select unit" />
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
          <FormField
            control={form.control}
            name="hsn_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HSN Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {(itemType === "slab" || itemType === "quartz") && (
          <div className="grid grid-cols-3 gap-4 rounded-md border p-3">
            <FormField
              control={form.control}
              name="thickness_mm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thickness (mm)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="18" {...field} value={(field.value as number | string | undefined) ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finish"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finish</FormLabel>
                  <FormControl>
                    <Input placeholder="Polished" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {itemType === "quartz" ? (
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color/Shade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {itemType === "tile" && (
          <div className="grid grid-cols-2 gap-4 rounded-md border p-3">
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size (e.g. 600x600)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finish"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finish</FormLabel>
                  <FormControl>
                    <Input placeholder="Glossy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gst_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} value={(field.value as number | string | undefined) ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="standard_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standard Rate (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} value={(field.value as number | string | undefined) ?? ""} />
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
                <FormLabel>Opening Qty</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} value={(field.value as number | string | undefined) ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="opening_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Value (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} value={(field.value as number | string | undefined) ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="low_stock_qty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Low Stock Alert Qty</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} value={(field.value as number | string | undefined) ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tracks_lots"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">
                Track by lot/bundle number (recommended for slabs &amp; quartz)
              </FormLabel>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Create Item"}
        </Button>
      </form>
    </Form>
  );
}
