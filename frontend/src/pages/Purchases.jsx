import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  Download,
  Eye,
  Plus,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/common/Primitives";
import { DataTable } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import { formatINR } from "@/data/mock";
import { useApiList } from "@/hooks/useApiList";
import { downloadCsv } from "@/lib/downloadCsv";
import { api } from "@/lib/api";

const seed = [
  {
    id: "PO1",
    number: "PUR-2026-0220",
    supplierBillNumber: "MC-1842",
    supplier: "Maven Components",
    date: "2026-06-03",
    amount: 184000,
    status: "pending",
  },
  {
    id: "PO2",
    number: "PUR-2026-0219",
    supplierBillNumber: "OP-285",
    supplier: "Orbit Packaging",
    date: "2026-06-01",
    amount: 28500,
    status: "paid",
  },
];

function PurchasesPage() {
  const navigate = useNavigate();
  const { rows, setRows } = useApiList("/purchases", seed);
  const [selectedBill, setSelectedBill] = useState(null);
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState({
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    method: "bank",
    reference: "",
  });

  const openPayment = (bill) => {
    const outstanding = Math.max(
      0,
      Number(bill.amount) - Number(bill.paidAmount || 0),
    );
    setSelectedBill(bill);
    setPayment({
      amount: String(outstanding),
      date: new Date().toISOString().slice(0, 10),
      method: "bank",
      reference: "",
    });
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    const amount = Number(payment.amount);
    const outstanding = selectedBill
      ? Math.max(
          0,
          Number(selectedBill.amount) - Number(selectedBill.paidAmount || 0),
        )
      : 0;
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");
    if (amount > outstanding) {
      return toast.error("Amount cannot exceed the outstanding balance");
    }

    try {
      setSaving(true);
      const updated = await api.post(`/purchases/${selectedBill.id}/pay`, {
        ...payment,
        amount,
      });
      const normalized = {
        ...updated,
        mongoId: updated.id,
        id: updated.purchaseId,
      };
      setRows((current) =>
        current.map((row) => (row.id === selectedBill.id ? normalized : row)),
      );
      toast.success(`Payment recorded for ${selectedBill.number}`);
      setSelectedBill(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "number",
      header: "Purchase #",
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/purchases/${row.id}`)}
          className="font-medium text-primary hover:underline"
        >
          {row.number}
        </button>
      ),
    },
    {
      key: "supplierBillNumber",
      header: "Supplier bill #",
      render: (row) => row.supplierBillNumber || "-",
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (row) => (
        <span className="text-muted-foreground">{row.supplier}</span>
      ),
    },
    {
      key: "date",
      header: "Bill date",
      render: (row) =>
        new Date(row.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right tabular-nums",
      render: (row) => formatINR(row.amount),
    },
    {
      key: "balance",
      header: "Balance",
      className: "text-right tabular-nums",
      render: (row) =>
        formatINR(
          Math.max(0, Number(row.amount) - Number(row.paidAmount || 0)),
        ),
    },
    {
      key: "status",
      header: "Payment",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/purchases/${row.id}`)}
          >
            <Eye className="h-4 w-4" /> View
          </Button>
          {!["paid", "cancelled", "draft"].includes(row.status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openPayment(row)}
            >
              <Banknote className="h-4 w-4" /> Pay
            </Button>
          )}
        </div>
      ),
    },
  ];
  const pending = rows
    .filter((row) => !["paid", "cancelled"].includes(row.status))
    .reduce(
      (sum, row) =>
        sum + Math.max(0, Number(row.amount) - Number(row.paidAmount || 0)),
      0,
    );
  const thisMonth = rows
    .filter((row) => {
      const value = new Date(row.date);
      const now = new Date();
      return (
        value.getMonth() === now.getMonth() &&
        value.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return (
    <>
      <PageHeader
        title="Purchase Bills"
        subtitle="Supplier invoices, purchase totals and pending payables"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv("purchase-bills.csv", rows)}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => navigate("/purchases/new")}>
              <Plus className="h-4 w-4" /> Create Purchase Bill
            </Button>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total purchases"
          value={formatINR(
            rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
          )}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Pending payable"
          value={formatINR(pending)}
          icon={<Wallet className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="This month"
          value={formatINR(thisMonth)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="info"
        />
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={["number", "supplierBillNumber", "supplier"]}
      />
      <Modal
        open={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        title="Record Supplier Payment"
        description={
          selectedBill
            ? `${selectedBill.number} - ${selectedBill.supplier}`
            : ""
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedBill(null)}>
              Cancel
            </Button>
            <Button onClick={submitPayment} disabled={saving}>
              {saving ? "Saving..." : "Record Payment"}
            </Button>
          </>
        }
      >
        <form onSubmit={submitPayment} className="space-y-4">
          {selectedBill && (
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/50 p-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Bill total</div>
                <div className="mt-1 font-semibold">
                  {formatINR(selectedBill.amount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Paid</div>
                <div className="mt-1 font-semibold">
                  {formatINR(selectedBill.paidAmount || 0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Outstanding</div>
                <div className="mt-1 font-semibold text-primary">
                  {formatINR(
                    Math.max(
                      0,
                      Number(selectedBill.amount) -
                        Number(selectedBill.paidAmount || 0),
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount paid" required>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={payment.amount}
                onChange={(event) =>
                  setPayment({ ...payment, amount: event.target.value })
                }
              />
            </Field>
            <Field label="Payment date" required>
              <Input
                type="date"
                value={payment.date}
                onChange={(event) =>
                  setPayment({ ...payment, date: event.target.value })
                }
              />
            </Field>
            <Field label="Payment method" required>
              <Select
                className="w-full"
                value={payment.method}
                onChange={(event) =>
                  setPayment({ ...payment, method: event.target.value })
                }
              >
                <option value="bank">Bank transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
              </Select>
            </Field>
            <Field label="Reference / transaction ID">
              <Input
                value={payment.reference}
                onChange={(event) =>
                  setPayment({ ...payment, reference: event.target.value })
                }
                placeholder="Bank ref., UPI ID or cheque no."
              />
            </Field>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default PurchasesPage;
