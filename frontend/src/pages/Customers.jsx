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
import { customers as seed, formatINR } from "@/data/mock";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
import { downloadCsv } from "@/lib/downloadCsv";
function CustomersPage() {
  const { rows, create } = useApiList("/customers", seed);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    status: "active",
  });
  const reset = () =>
    setForm({ name: "", email: "", phone: "", city: "", status: "active" });
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Customer name is required");
    try {
      await create({ ...form, outstanding: 0, totalBilled: 0 });
      toast.success(`Customer "${form.name}" added`);
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error.message);
    }
  };
  const cols = [
    {
      key: "name",
      header: "Customer",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent text-accent-foreground grid place-items-center text-xs font-semibold">
            {r.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-muted-foreground">
              {r.email || "—"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (r) => (
        <span className="text-muted-foreground">{r.phone || "—"}</span>
      ),
    },
    { key: "city", header: "City", render: (r) => r.city || "—" },
    {
      key: "totalBilled",
      header: "Billed",
      className: "text-right tabular-nums",
      render: (r) => formatINR(r.totalBilled),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      className: "text-right tabular-nums",
      render: (r) => (
        <span
          className={r.outstanding > 0 ? "text-destructive font-medium" : ""}
        >
          {formatINR(r.outstanding)}
        </span>
      ),
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
        title="Customers"
        subtitle={`${rows.length} customers in your directory`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv("customers.csv", rows)}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add customer
            </Button>
          </>
        }
      />
      <DataTable
        rows={rows}
        columns={cols}
        searchKeys={["name", "email", "city"]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add customer"
        description="Create a new customer record"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Save customer</Button>
          </>
        }
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Field label="Customer name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Traders"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="billing@acme.in"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98XXX XXXXX"
            />
          </Field>
          <Field label="City">
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Mumbai"
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </form>
      </Modal>
    </>
  );
}

export default CustomersPage;
