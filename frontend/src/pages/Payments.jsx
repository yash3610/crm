import { useMemo, useState } from "react";
import { Banknote, IndianRupee, Plus, ReceiptText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/common/DataTable";
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
} from "@/components/common/Primitives";
import { useAuth } from "@/context/AuthContext";
import { formatINR, invoices as invoiceSeed, payments } from "@/data/mock";
import { useApiList } from "@/hooks/useApiList";

const emptyForm = {
  invoiceId: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  method: "upi",
  reference: "",
};

function Payments() {
  const { user } = useAuth();
  const { rows, create, remove } = useApiList("/payments", payments);
  const { rows: invoices, reload: reloadInvoices } = useApiList(
    "/invoices",
    invoiceSeed,
  );
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [form, setForm] = useState(emptyForm);

  const paidByInvoice = useMemo(
    () =>
      rows.reduce((totals, payment) => {
        const number = payment.invoiceNumber || payment.invoice;
        totals[number] = (totals[number] || 0) + Number(payment.amount || 0);
        return totals;
      }, {}),
    [rows],
  );

  const payableInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const paid = paidByInvoice[invoice.number] || 0;
        return (
          !["draft", "cancelled"].includes(invoice.status) &&
          Number(invoice.amount) > paid
        );
      }),
    [invoices, paidByInvoice],
  );

  const selectedInvoice = invoices.find(
    (invoice) => invoice.id === form.invoiceId,
  );
  const alreadyPaid = selectedInvoice
    ? paidByInvoice[selectedInvoice.number] || 0
    : 0;
  const outstanding = selectedInvoice
    ? Math.max(0, Number(selectedInvoice.amount) - alreadyPaid)
    : 0;
  const canRecord = ["Owner", "Admin", "Accountant"].includes(user?.role);
  const totalReceived = rows.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0,
  );

  const openPaymentModal = () => {
    const firstInvoice = payableInvoices[0];
    setForm({
      ...emptyForm,
      invoiceId: firstInvoice?.id || "",
      amount: firstInvoice
        ? String(
            Math.max(
              0,
              Number(firstInvoice.amount) -
                (paidByInvoice[firstInvoice.number] || 0),
            ),
          )
        : "",
    });
    setOpen(true);
  };

  const selectInvoice = (invoiceId) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    const balance = invoice
      ? Math.max(
          0,
          Number(invoice.amount) - (paidByInvoice[invoice.number] || 0),
        )
      : 0;
    setForm((current) => ({
      ...current,
      invoiceId,
      amount: balance ? String(balance) : "",
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!selectedInvoice) return toast.error("Select an invoice");
    if (!amount || amount <= 0)
      return toast.error("Enter a valid payment amount");
    if (amount > outstanding)
      return toast.error("Amount cannot exceed the outstanding balance");

    try {
      setSaving(true);
      await create({
        invoice: selectedInvoice.mongoId,
        invoiceNumber: selectedInvoice.number,
        customer: selectedInvoice.customer,
        amount,
        date: form.date,
        method: form.method,
        reference: form.reference.trim(),
      });
      toast.success(`Payment recorded for ${selectedInvoice.number}`);
      setOpen(false);
      setForm(emptyForm);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deletePayment = async (payment) => {
    if (
      !window.confirm(
        `Delete payment of ${formatINR(payment.amount)} for ${payment.invoiceNumber || payment.invoice}?`,
      )
    ) {
      return;
    }

    try {
      setDeleting(payment.id);
      await remove(payment.id);
      await reloadInvoices();
      toast.success("Payment deleted and balances updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting("");
    }
  };

  const columns = [
    {
      key: "invoice",
      header: "Invoice",
      render: (row) => (
        <span className="font-medium">{row.invoiceNumber || row.invoice}</span>
      ),
    },
    { key: "customer", header: "Customer", render: (row) => row.customer },
    {
      key: "date",
      header: "Date",
      render: (row) =>
        new Date(row.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "method",
      header: "Method",
      render: (row) => (
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium uppercase">
          {row.method}
        </span>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      render: (row) => (
        <span className="text-muted-foreground">{row.reference || "-"}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right tabular-nums",
      render: (row) => formatINR(row.amount),
    },
    ...(canRecord
      ? [
          {
            key: "actions",
            header: "",
            className: "w-14 text-right",
            render: (row) => (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={deleting === row.id}
                onClick={() => deletePayment(row)}
                aria-label="Delete payment"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Record and track money received against customer invoices"
        actions={
          canRecord && (
            <Button onClick={openPaymentModal}>
              <Plus className="h-4 w-4" /> Record payment
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Total received
              </div>
              <div className="text-xl font-semibold">
                {formatINR(totalReceived)}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Payment entries
              </div>
              <div className="text-xl font-semibold">{rows.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-warning/15 text-warning">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Awaiting payment
              </div>
              <div className="text-xl font-semibold">
                {payableInvoices.length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={["invoice", "invoiceNumber", "customer", "reference"]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record payment"
        description="Add money received against an outstanding invoice"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving || !selectedInvoice}>
              {saving ? "Saving..." : "Record payment"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Invoice" required>
            <Select
              value={form.invoiceId}
              onChange={(event) => selectInvoice(event.target.value)}
            >
              {payableInvoices.length === 0 && (
                <option value="">No outstanding invoices</option>
              )}
              {payableInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.number} - {invoice.customer}
                </option>
              ))}
            </Select>
          </Field>

          {selectedInvoice && (
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/50 p-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">
                  Invoice total
                </div>
                <div className="mt-1 font-semibold">
                  {formatINR(selectedInvoice.amount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Already received
                </div>
                <div className="mt-1 font-semibold">
                  {formatINR(alreadyPaid)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Outstanding</div>
                <div className="mt-1 font-semibold text-primary">
                  {formatINR(outstanding)}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount received" required>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                max={outstanding || undefined}
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
              />
            </Field>
            <Field label="Payment date" required>
              <Input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm({ ...form, date: event.target.value })
                }
              />
            </Field>
            <Field label="Payment method" required>
              <Select
                value={form.method}
                onChange={(event) =>
                  setForm({ ...form, method: event.target.value })
                }
              >
                <option value="upi">UPI</option>
                <option value="bank">Bank transfer</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </Select>
            </Field>
            <Field label="Reference / transaction ID">
              <Input
                value={form.reference}
                onChange={(event) =>
                  setForm({ ...form, reference: event.target.value })
                }
                placeholder="UPI ID, cheque no., bank ref."
              />
            </Field>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Payments;
