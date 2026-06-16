import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Plus } from "lucide-react";

import { Input } from "@/components/common/Primitives";
import { cn } from "@/lib/utils";

export function CategoryPicker({
  value,
  onChange,
  options,
  placeholder = "Select or add category",
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const inputRef = useRef(null);
  const query = value.trim();
  const normalizedQuery = query.toLowerCase();
  const normalizedOptions = useMemo(
    () => new Set(options.map((item) => item.toLowerCase())),
    [options],
  );
  const matches = useMemo(() => {
    const filtered = normalizedQuery
      ? options.filter((item) => item.toLowerCase().includes(normalizedQuery))
      : options;
    return filtered.slice(0, 6);
  }, [normalizedQuery, options]);
  const canAdd = query && !normalizedOptions.has(normalizedQuery);
  const updateMenuPosition = () => {
    const rect = inputRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuStyle({
      left: rect.left,
      top: rect.bottom + 8,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, value]);

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            style={menuStyle}
            className="fixed z-[70] max-h-48 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
          >
            {matches.map((item) => {
              const selected = item.toLowerCase() === normalizedQuery;
              return (
                <button
                  type="button"
                  key={item}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(item);
                    setAddingNew(false);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent",
                    selected && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="min-w-0 truncate">{item}</span>
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
            {(canAdd || !query) && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setAddingNew(true);
                  if (query) setOpen(false);
                  window.setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-primary hover:bg-accent"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">
                  {query ? `Add "${query}"` : "Add new category"}
                </span>
              </button>
            )}
            {!matches.length && !canAdd && (
              <div className="px-2.5 py-2 text-sm text-muted-foreground">
                No categories found
              </div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setAddingNew(true);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder={addingNew ? "Enter new category name" : placeholder}
        autoComplete="off"
      />
      {menu}
    </div>
  );
}
