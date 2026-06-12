import { useState } from "react";
import {
  PageHeader,
  Button,
  StatusBadge,
  Modal,
  Field,
  Input,
  Select,
} from "@/components/common/Primitives";
import { DataTable } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import { formatINR, suppliers } from "@/data/mock";
import { Plus, Download, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
import { downloadCsv } from "@/lib/downloadCsv";
const seed = [
  {
    id: "PO1",
    number: "PO-2026-0220",
    supplier: "Maven Components",
    date: "2026-06-03",
    amount: 184000,
    status: "pending",
  },
  {
    id: "PO2",
    number: "PO-2026-0219",
    supplier: "Orbit Packaging",
    date: "2026-06-01",
    amount: 28500,
    status: "paid",
  },
  {
    id: "PO3",
    number: "PO-2026-0218",
    supplier: "Vertex Hardware",
    date: "2026-05-28",
    amount: 76200,
    status: "paid",
  },
  {
    id: "PO4",
    number: "PO-2026-0217",
    supplier: "Solace Textiles",
    date: "2026-05-22",
    amount: 142000,
    status: "overdue",
  },
  {
    id: "PO5",
    number: "PO-2026-0216",
    supplier: "Maven Components",
    date: "2026-05-18",
    amount: 64500,
    status: "paid",
  },
];
function PurchasesPage() {
  const { rows, create } = useApiList("/purchases", seed);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    supplier: suppliers[0].name,
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    status: "pending",
  });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.supplier || !f.amount)
      return toast.error("Supplier and amount are required");
    const number = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    try {
      await create({ number, ...f, amount: Number(f.amount) });
      toast.success(`Purchase order ${number} created`);
      setOpen(false);
      setF({
        supplier: suppliers[0].name,
        date: new Date().toISOString().slice(0, 10),
        amount: 0,
        status: "pending",
      });
    } catch (error) {
      toast.error(error.message);
    }
  };
  const cols = [
    {
      key: "number",
      header: "PO",
      render: (r) => <span className="font-medium">{r.number}</span>,
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (r) => (
        <span className="text-muted-foreground">{r.supplier}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (r) =>
        new Date(r.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right tabular-nums",
      render: (r) => formatINR(r.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];
  return (
    <>
      <PageHeader
        title="Purchases"
        subtitle="Purchase orders, bills and supplier payments"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv("purchases.csv", rows)}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New PO
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total purchases"
          value={formatINR(rows.reduce((s, r) => s + r.amount, 0))}
          delta={4.8}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Pending payable"
          value={formatINR(
            rows
              .filter((r) => r.status !== "paid")
              .reduce((s, r) => s + r.amount, 0),
          )}
          delta={-1.5}
          icon={<Wallet className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="This month"
          value={formatINR(212500)}
          delta={9.2}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="info"
        />
      </div>
      <DataTable
        rows={rows}
        columns={cols}
        searchKeys={["number", "supplier"]}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New purchase order"
        description="Create a PO for a supplier"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Create PO</Button>
          </>
        }
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Field label="Supplier" required>
            <Select
              value={f.supplier}
              onChange={(e) => setF({ ...f, supplier: e.target.value })}
            >
              {suppliers.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={f.status}
              onChange={(e) => setF({ ...f, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </Select>
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
            />
          </Field>
          <Field label="Amount (₹)" required>
            <Input
              type="number"
              value={f.amount}
              onChange={(e) => setF({ ...f, amount: Number(e.target.value) })}
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}

export default PurchasesPage;
