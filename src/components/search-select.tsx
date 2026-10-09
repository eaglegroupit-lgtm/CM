"use client";

import { useMemo } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export interface SearchOption {
  value: string;
  label: string;
  /** Secondary text shown on the right of the option (e.g. price, stock, phone). */
  hint?: string;
}

/** Type-to-search single select. `value`/`onChange` work with the option's string value. */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Type to search...",
  emptyText = "Nothing found",
  className,
}: {
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}) {
  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  return (
    <Combobox<SearchOption>
      items={options}
      value={selected}
      onValueChange={(o) => onChange(o?.value ?? "")}
      itemToStringLabel={(o) => o.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
      autoHighlight
    >
      <ComboboxInput placeholder={placeholder} className={className ?? "w-full"} />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(o: SearchOption) => (
            <ComboboxItem key={o.value} value={o}>
              <span className="flex-1 truncate">{o.label}</span>
              {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
