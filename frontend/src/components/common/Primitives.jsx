import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
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
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="p-4 border-t border-border bg-muted/30 rounded-b-2xl flex justify-end gap-2">
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
    <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 mb-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
export function Card({ className, children }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-card",
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
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15",
        className,
      )}
      {...props}
    />
  );
}
export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15",
        className,
      )}
      {...props}
    >
      {children}
    </select>
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
