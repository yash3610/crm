import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "./Primitives";
import { cn } from "@/lib/utils";
export function StatCard({ label, value, delta, icon, tone = "primary" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground dark:text-warning",
    info: "bg-info/15 text-info",
  };
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </div>
          <div className="text-2xl font-semibold mt-1.5 tabular-nums truncate">
            {value}
          </div>
          {delta !== undefined && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium mt-2",
                positive ? "text-success" : "text-destructive",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(delta)}% vs last month
            </div>
          )}
        </div>
        <div
          className={cn(
            "h-10 w-10 rounded-xl grid place-items-center shrink-0",
            tones[tone],
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
