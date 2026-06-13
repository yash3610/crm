import { AlertTriangle, CircleHelp, Info, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/common/Primitives";
import { cn } from "@/lib/utils";

const icons = {
  danger: Trash2,
  warning: AlertTriangle,
  info: Info,
  question: CircleHelp,
};

const iconStyles = {
  danger: "bg-destructive/10 text-destructive ring-destructive/15",
  warning: "bg-warning/15 text-warning ring-warning/20",
  info: "bg-info/15 text-info ring-info/20",
  question: "bg-primary/10 text-primary ring-primary/15",
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
}) {
  const Icon = icons[tone] || icons.danger;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl border-border p-6 text-center shadow-2xl">
        <div
          className={cn(
            "mx-auto grid h-16 w-16 place-items-center rounded-full ring-8",
            iconStyles[tone] || iconStyles.danger,
          )}
        >
          <Icon className="h-7 w-7" />
        </div>
        <AlertDialogHeader className="mt-3 text-center sm:text-center">
          <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="mx-auto max-w-sm leading-6">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-3 grid grid-cols-2 gap-3 sm:grid sm:grid-cols-2 sm:space-x-0">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={loading}>
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <Button
            variant={tone === "danger" ? "destructive" : "primary"}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Please wait..." : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
