import { useState } from "react";
import {
  PageHeader,
  Button,
  StatusBadge,
  Select,
  Modal,
  Field,
  Input,
} from "@/components/common/Primitives";
import { DataTable } from "@/components/common/DataTable";
import { formatINR, customers } from "@/data/mock";
import { Plus, Download, Send } from "lucide-react";
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
import { downloadCsv } from "@/lib/downloadCsv";
const seed = [
  {
    id: "Q1",
    number: "QUO-2026-0421",
    customer: "Acme Traders",
    date: "2026-06-04",
    validTill: "2026-06-18",
    amount: 84200,
    status: "sent",
  },
  {
    id: "Q2",
    number: "QUO-2026-0420",
    customer: "Nimbus Retail",
    date: "2026-06-02",
    validTill: "2026-06-16",
    amount: 31800,
    status: "accepted",
  },
  {
    id: "Q3",
    number: "QUO-2026-0419",
    customer: "Patel & Sons",
    date: "2026-05-30",
    validTill: "2026-06-13",
    amount: 14250,
    status: "expired",
  },
  {
    id: "Q4",
    number: "QUO-2026-0418",
    customer: "Coastal Foods",
    date: "2026-05-28",
    validTill: "2026-06-11",
    amount: 212000,
    status: "sent",
  },
  {
    id: "Q5",
    number: "QUO-2026-0417",
    customer: "Lumen Studios",
    date: "2026-05-25",
    validTill: "2026-06-08",
    amount: 9800,
    status: "draft",
  },
];
function QuotationsPage() {
  const { rows, create } = useApiList("/quotations", seed);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    customer: customers[0].name,
    date: new Date().toISOString().slice(0, 10),
    validTill: "",
    amount: 0,
    status: "draft",
  });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.customer || !f.amount)
      return toast.error("Customer and amount are required");
    const number = `QUO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    try {
      await create({
        number,
        ...f,
        amount: Number(f.amount),
        validTill: f.validTill || f.date,
      });
      toast.success(`Quotation ${number} created`);
      setOpen(false);
      setF({
        customer: customers[0].name,
        date: new Date().toISOString().slice(0, 10),
        validTill: "",
        amount: 0,
        status: "draft",
      });
    } catch (error) {
      toast.error(error.message);
    }
  };
  const cols = [
    {
      key: "number",
      header: "Quote",
      render: (r) => <span className="font-medium">{r.number}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      render: (r) => (
        <span className="text-muted-foreground">{r.customer}</span>
      ),
    },
    {
      key: "date",
      header: "Issued",
      render: (r) =>
        new Date(r.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
    },
    {
      key: "valid",
      header: "Valid till",
      render: (r) =>
        new Date(r.validTill).toLocaleDateString("en-IN", {
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
      render: (r) => (
        <StatusBadge
          status={
            r.status === "accepted"
              ? "paid"
              : r.status === "expired"
                ? "overdue"
                : r.status === "sent"
                  ? "pending"
                  : "draft"
          }
        />
      ),
    },
    {
      key: "act",
      header: "",
      className: "text-right",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const subject = encodeURIComponent(`Quotation ${row.number}`);
            const body = encodeURIComponent(
              `Hello,\n\nQuotation ${row.number} for ${formatINR(row.amount)} is valid until ${new Date(row.validTill).toLocaleDateString("en-IN")}.\n\nRegards`,
            );
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
          }}
        >
          <Send className="h-3.5 w-3.5" /> Send
        </Button>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Quotations"
        subtitle="Send and track customer quotations"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv("quotations.csv", rows)}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New quotation
            </Button>
          </>
        }
      />
      <DataTable
        rows={rows}
        columns={cols}
        searchKeys={["number", "customer"]}
        toolbar={
          <Select defaultValue="all">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
          </Select>
        }
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New quotation"
        description="Draft a customer quotation"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Create quotation</Button>
          </>
        }
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Field label="Customer" required>
            <Select
              value={f.customer}
              onChange={(e) => setF({ ...f, customer: e.target.value })}
            >
              {customers.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={f.status}
              onChange={(e) => setF({ ...f, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
            </Select>
          </Field>
          <Field label="Issue date">
            <Input
              type="date"
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
            />
          </Field>
          <Field label="Valid till">
            <Input
              type="date"
              value={f.validTill}
              onChange={(e) => setF({ ...f, validTill: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Amount (₹)" required>
              <Input
                type="number"
                value={f.amount}
                onChange={(e) => setF({ ...f, amount: Number(e.target.value) })}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default QuotationsPage;
