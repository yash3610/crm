import { PageHeader, Card, Button } from "@/components/common/Primitives";
import { Bell, CheckCircle2, AlertTriangle, Info, Package } from "lucide-react";
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
import { api } from "@/lib/api";
const seed = [
  {
    id: "n1",
    type: "success",
    title: "Payment received",
    body: "Nimbus Retail paid ₹21,850 via UPI",
    time: "2 hours ago",
    icon: CheckCircle2,
  },
  {
    id: "n2",
    type: "warning",
    title: "Invoice overdue",
    body: "INV-2026-1003 (Coastal Foods) is 4 days past due",
    time: "5 hours ago",
    icon: AlertTriangle,
  },
  {
    id: "n3",
    type: "info",
    title: "Low stock alert",
    body: "Cotton Fabric 1m has only 3 units remaining",
    time: "1 day ago",
    icon: Package,
  },
  {
    id: "n4",
    type: "info",
    title: "New customer added",
    body: "Lumen Studios was added to your directory",
    time: "2 days ago",
    icon: Info,
  },
  {
    id: "n5",
    type: "success",
    title: "GST report generated",
    body: "GSTR-1 for May 2026 is ready to download",
    time: "3 days ago",
    icon: CheckCircle2,
  },
  {
    id: "n6",
    type: "warning",
    title: "Subscription reminder",
    body: "Your Premium plan renews on July 1, 2026",
    time: "5 days ago",
    icon: Bell,
  },
];
const tone = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground dark:text-warning",
  info: "bg-info/15 text-info",
};
function NotificationsPage() {
  const { rows: items, setRows } = useApiList("/notifications", seed);
  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all", {});
      setRows((current) => current.map((item) => ({ ...item, read: true })));
      window.dispatchEvent(new Event("notifications:updated"));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Stay on top of activity, alerts and reminders"
        actions={
          <Button variant="outline" onClick={markAllRead}>
            Mark all read
          </Button>
        }
      />
      <Card className="divide-y divide-border">
        {items.map((n) => {
          const Icon =
            n.icon ||
            (n.type === "success"
              ? CheckCircle2
              : n.type === "warning"
                ? AlertTriangle
                : Info);
          return (
            <div
              key={n.id}
              className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors"
            >
              <div
                className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${tone[n.type]}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {n.time ||
                      new Date(n.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}

export default NotificationsPage;
