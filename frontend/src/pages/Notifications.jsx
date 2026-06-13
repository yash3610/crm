import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Info,
  Package,
  ReceiptText,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Select,
} from "@/components/common/Primitives";
import { useApiList } from "@/hooks/useApiList";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const typeStyles = {
  success: {
    icon: CheckCircle2,
    className: "bg-success/15 text-success",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-warning/20 text-warning-foreground dark:text-warning",
  },
  error: {
    icon: AlertCircle,
    className: "bg-destructive/15 text-destructive",
  },
  info: {
    icon: Info,
    className: "bg-info/15 text-info",
  },
};

const categoryIcons = {
  payments: CircleDollarSign,
  purchases: ShoppingBag,
  inventory: Package,
  expenses: ReceiptText,
  sales: ReceiptText,
  system: Bell,
};

const categoryLabels = {
  sales: "Sales",
  payments: "Payments",
  purchases: "Purchases",
  inventory: "Inventory",
  expenses: "Expenses",
  system: "System",
};

function relativeTime(value) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function NotificationsPage() {
  const navigate = useNavigate();
  const {
    rows: items,
    setRows,
    loading,
    remove,
  } = useApiList("/notifications", []);
  const [view, setView] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [workingId, setWorkingId] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const unreadCount = items.filter((item) => !item.read).length;
  const readCount = items.length - unreadCount;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesView =
        view === "all" ||
        (view === "unread" && !item.read) ||
        (view === "read" && item.read);
      const matchesCategory =
        category === "all" || (item.category || "system") === category;
      const matchesQuery =
        !needle ||
        [item.title, item.body, item.category].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(needle),
        );
      return matchesView && matchesCategory && matchesQuery;
    });
  }, [items, view, category, query]);

  const notifyUpdated = () =>
    window.dispatchEvent(new Event("notifications:updated"));

  const setRead = async (item, read) => {
    try {
      setWorkingId(item.id);
      const updated = await api.patch(`/notifications/${item.id}/read`, {
        read,
      });
      setRows((current) =>
        current.map((row) => (row.id === item.id ? updated : row)),
      );
      notifyUpdated();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setWorkingId("");
    }
  };

  const markAllRead = async () => {
    try {
      setWorkingId("all");
      await api.patch("/notifications/read-all", {});
      setRows((current) => current.map((item) => ({ ...item, read: true })));
      notifyUpdated();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setWorkingId("");
    }
  };

  const deleteNotification = async (item) => {
    try {
      setWorkingId(item.id);
      await remove(item.id);
      notifyUpdated();
      toast.success("Notification deleted");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setWorkingId("");
    }
  };

  const clearRead = async () => {
    try {
      setClearing(true);
      await api.delete("/notifications/read");
      setRows((current) => current.filter((item) => !item.read));
      setClearOpen(false);
      notifyUpdated();
      toast.success("Read notifications cleared");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setClearing(false);
    }
  };

  const openNotification = async (item) => {
    if (!item.read) await setRead(item, true);
    if (item.actionUrl) navigate(item.actionUrl);
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Live alerts from sales, payments, purchases, inventory and expenses"
        actions={
          <>
            {readCount > 0 && (
              <Button variant="ghost" onClick={() => setClearOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Clear read
              </Button>
            )}
            <Button
              variant="outline"
              onClick={markAllRead}
              disabled={!unreadCount || workingId === "all"}
            >
              <Check className="h-4 w-4" />
              {workingId === "all" ? "Updating..." : "Mark all read"}
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Total notifications
          </div>
          <div className="mt-1 text-2xl font-semibold">{items.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Unread
          </div>
          <div className="mt-1 text-2xl font-semibold text-primary">
            {unreadCount}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Read
          </div>
          <div className="mt-1 text-2xl font-semibold">{readCount}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
            {[
              ["all", `All (${items.length})`],
              ["unread", `Unread (${unreadCount})`],
              ["read", `Read (${readCount})`],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  view === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notifications"
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-64"
              />
            </div>
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-16 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : filtered.length ? (
            filtered.map((item) => {
              const style = typeStyles[item.type] || typeStyles.info;
              const Icon =
                categoryIcons[item.category || "system"] || style.icon;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group flex items-start gap-4 p-4 transition-colors hover:bg-muted/30",
                    !item.read && "bg-primary/[0.035]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openNotification(item)}
                    className="flex min-w-0 flex-1 items-start gap-4 text-left"
                  >
                    <div
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                        style.className,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold">
                          {item.title}
                        </div>
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <Badge tone="neutral">
                          {categoryLabels[item.category] || "System"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.body}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {relativeTime(item.createdAt)}
                        {item.actionUrl && " - Open details"}
                      </div>
                    </div>
                  </button>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={workingId === item.id}
                      onClick={() => setRead(item, !item.read)}
                      title={item.read ? "Mark as unread" : "Mark as read"}
                    >
                      {item.read ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={workingId === item.id}
                      onClick={() => deleteNotification(item)}
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-16 text-center">
              <Bell className="mx-auto h-9 w-9 text-muted-foreground" />
              <div className="mt-3 font-medium">No notifications found</div>
              <p className="mt-1 text-sm text-muted-foreground">
                New business activity and alerts will appear here.
              </p>
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={(open) => !open && !clearing && setClearOpen(false)}
        title="Clear read notifications?"
        description={`${readCount} read notification${readCount === 1 ? "" : "s"} will be permanently deleted.`}
        confirmLabel="Clear notifications"
        loading={clearing}
        onConfirm={clearRead}
      />
    </>
  );
}

export default NotificationsPage;
