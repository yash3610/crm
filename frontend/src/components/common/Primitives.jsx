import { Children, isValidElement, useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  const widths = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]",
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 rounded-b-2xl border-t border-border bg-muted/30 p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
export function Field({ label, children, hint, required }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </label>
  );
}
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
export function Card({ className, children }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-border bg-card text-card-foreground shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
const tones = {
  success: "bg-success/15 text-success border-success/20",
  warning:
    "bg-warning/20 text-warning-foreground border-warning/30 dark:text-warning",
  destructive: "bg-destructive/15 text-destructive border-destructive/20",
  info: "bg-info/15 text-info border-info/20",
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/15 text-primary border-primary/20",
};
export function Badge({ tone = "neutral", children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
export function StatusBadge({ status }) {
  const map = {
    paid: "success",
    pending: "warning",
    overdue: "destructive",
    draft: "neutral",
    active: "success",
    inactive: "neutral",
    low: "warning",
    out: "destructive",
    ok: "info",
  };
  return (
    <Badge tone={map[status] ?? "neutral"}>
      {status[0].toUpperCase() + status.slice(1)}
    </Badge>
  );
}
const btn = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  outline: "border border-border bg-background hover:bg-accent",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) {
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-sm",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
        btn[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
export function Input({ className, ...props }) {
  if (props.type === "date") {
    return <DateInput className={className} {...props} />;
  }

  return (
    <input
      className={cn(
        "h-9 w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15",
        className,
      )}
      {...props}
    />
  );
}

function parseDate(value) {
  if (!value) return undefined;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatDateValue(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value) {
  const date = parseDate(value);
  if (!date) return "Select date";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DateInput({
  type: _type,
  className,
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  min,
  max,
  required,
  ...props
}) {
  void _type;
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const [open, setOpen] = useState(false);
  const currentValue = controlled ? value : internalValue;

  const selectDate = (date) => {
    if (!date) return;
    const nextValue = formatDateValue(date);
    if (!controlled) setInternalValue(nextValue);
    onChange?.({
      target: { value: nextValue, name },
      currentTarget: { value: nextValue, name },
    });
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-9 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-left text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:pointer-events-none disabled:opacity-50",
              !currentValue && "text-muted-foreground",
              className,
            )}
            {...props}
          >
            <span className="min-w-0 truncate">
              {displayDate(currentValue)}
            </span>
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          collisionPadding={8}
          className="w-[min(19rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] p-1"
        >
          <Calendar
            mode="single"
            selected={parseDate(currentValue)}
            defaultMonth={parseDate(currentValue) || new Date()}
            onSelect={selectDate}
            disabled={[
              ...(parseDate(min) ? [{ before: parseDate(min) }] : []),
              ...(parseDate(max) ? [{ after: parseDate(max) }] : []),
            ]}
            className="w-full p-2 [--cell-size:2rem]"
          />
        </PopoverContent>
      </Popover>
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue || ""}
          required={required}
        />
      )}
    </>
  );
}
export function Select({
  className,
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  name,
  required,
  ...props
}) {
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((option) => ({
      value: String(option.props.value ?? option.props.children ?? ""),
      label: option.props.children,
      disabled: Boolean(option.props.disabled),
    }));
  const placeholder = options.find((option) => option.value === "");
  const selectableOptions = options.filter((option) => option.value !== "");

  return (
    <SelectRoot
      value={value === undefined ? undefined : String(value)}
      defaultValue={
        defaultValue === undefined ? undefined : String(defaultValue)
      }
      onValueChange={(nextValue) =>
        onChange?.({
          target: { value: nextValue, name },
          currentTarget: { value: nextValue, name },
        })
      }
      disabled={disabled}
      name={name}
      required={required}
    >
      <SelectTrigger
        className={cn(
          "w-full min-w-0 rounded-lg bg-background text-left focus:border-primary focus:ring-2 focus:ring-primary/15",
          className,
        )}
        {...props}
      >
        <SelectValue placeholder={placeholder?.label || "Select"} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={4}
        collisionPadding={12}
        className="max-h-[min(18rem,50vh)] max-w-[calc(100vw-24px)]"
      >
        {selectableOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="min-h-9 whitespace-normal break-words"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
export function EmptyState({ title, body, icon }) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto h-12 w-12 rounded-xl bg-muted grid place-items-center text-muted-foreground mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {body && <p className="text-sm text-muted-foreground mt-1">{body}</p>}
    </div>
  );
}
