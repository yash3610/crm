import { useEffect, useMemo, useState } from "react";
import {
  PageHeader,
  Card,
  StatusBadge,
  Button,
  Modal,
  Field,
  Input,
  Select,
} from "@/components/common/Primitives";
import { products as seed } from "@/data/mock";
import {
  Boxes,
  AlertTriangle,
  PackageX,
  Download,
  Plus,
  Minus,
  History,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/common/LoadingSkeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/downloadCsv";
function InventoryPage() {
  const [items, setItems] = useState(seed);
  const [moves, setMoves] = useState([
    {
      id: "M1",
      sku: "BP-WIDGET-01",
      name: "Premium Widget",
      type: "in",
      qty: 50,
      reason: "Purchase received",
      date: "2026-06-08",
    },
    {
      id: "M2",
      sku: "BP-GEAR-22",
      name: "Industrial Gear 22mm",
      type: "out",
      qty: 12,
      reason: "Invoice INV-2026-1001",
      date: "2026-06-07",
    },
  ]);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [f, setF] = useState({ type: "in", qty: 0, reason: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/inventory")
      .then((data) => {
        setItems(data.products);
        setMoves(
          data.movements.map((movement) => ({
            ...movement,
            name: movement.productName,
            date: movement.createdAt,
          })),
        );
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);
  const out = items.filter((p) => p.stock === 0).length;
  const low = items.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const totalValue = useMemo(
    () => items.reduce((s, p) => s + p.price * p.stock, 0),
    [items],
  );
  const startAdjust = (p, type) => {
    setTarget(p);
    setF({ type, qty: 0, reason: "" });
    setOpen(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!target || !f.qty) return toast.error("Quantity is required");
    try {
      const data = await api.post("/inventory/adjust", {
        productId: target.id,
        type: f.type,
        qty: Number(f.qty),
        reason: f.reason,
      });
      setItems((current) =>
        current.map((product) =>
          product.id === target.id ? data.product : product,
        ),
      );
      setMoves((current) => [
        {
          ...data.movement,
          name: data.movement.productName,
          date: data.movement.createdAt,
        },
        ...current,
      ]);
      toast.success(
        `${f.type === "in" ? "Added" : "Removed"} ${f.qty} ${target.unit} of ${target.name}`,
      );
      setOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };
  if (loading) {
    return (
      <>
        <PageHeaderSkeleton actions={1} />
        <StatCardsSkeleton />
        <Card className="mb-6 p-5">
          <Skeleton className="mb-4 h-5 w-32" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="space-y-4 rounded-lg border border-border p-4"
              >
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-8 w-20" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </>
    );
  }
  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Stock levels, adjustments and movement history"
        actions={
          <Button
            variant="outline"
            onClick={() => downloadCsv("inventory.csv", items)}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total SKUs"
          value={String(items.length)}
          icon={<Boxes className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Low stock"
          value={String(low)}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Out of stock"
          value={String(out)}
          icon={<PackageX className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Inventory value"
          value={`₹${(totalValue / 100000).toFixed(1)}L`}
          icon={<Boxes className="h-5 w-5" />}
          tone="primary"
        />
      </div>

      <Card className="p-5 mb-6">
        <h3 className="font-semibold mb-4">Manage stock</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.sku}</div>
                </div>
                <StatusBadge
                  status={p.stock === 0 ? "out" : p.stock <= 10 ? "low" : "ok"}
                />
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {p.stock}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {p.unit}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => startAdjust(p, "in")}
                >
                  <Plus className="h-3.5 w-3.5" /> Stock in
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => startAdjust(p, "out")}
                >
                  <Minus className="h-3.5 w-3.5" /> Stock out
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Recent movements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {new Date(m.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.sku}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      status={m.type === "in" ? "paid" : "pending"}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                    {m.type === "in" ? "+" : "-"}
                    {m.qty}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {m.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${f.type === "in" ? "Stock in" : "Stock out"} · ${target?.name ?? ""}`}
        description={`Current stock: ${target?.stock ?? 0} ${target?.unit ?? ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Save adjustment</Button>
          </>
        }
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Field label="Movement type">
            <Select
              value={f.type}
              onChange={(e) => setF({ ...f, type: e.target.value })}
            >
              <option value="in">Stock in</option>
              <option value="out">Stock out</option>
            </Select>
          </Field>
          <Field label="Quantity" required>
            <Input
              type="number"
              min={1}
              value={f.qty}
              onChange={(e) => setF({ ...f, qty: Number(e.target.value) })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Reason">
              <Input
                value={f.reason}
                onChange={(e) => setF({ ...f, reason: e.target.value })}
                placeholder={
                  f.type === "in"
                    ? "Purchase, return, correction…"
                    : "Sale, damage, correction…"
                }
              />
            </Field>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default InventoryPage;
