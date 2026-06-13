import { useState } from "react";
import {
  PageHeader,
  Button,
  Modal,
  Field,
  Input,
  Select,
} from "@/components/common/Primitives";
import { DataTable } from "@/components/common/DataTable";
import { expenses as seed, formatINR } from "@/data/mock";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
function ExpensesPage() {
  const { rows, loading, create, pagination, setPage, setPageSize, setSearch } =
    useApiList("/expenses", seed, { paginated: true });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    category: "Rent",
    vendor: "",
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    note: "",
  });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.vendor.trim() || !f.amount)
      return toast.error("Vendor and amount are required");
    try {
      await create({ ...f, amount: Number(f.amount) });
      toast.success("Expense recorded");
      setOpen(false);
      setF({
        category: "Rent",
        vendor: "",
        date: new Date().toISOString().slice(0, 10),
        amount: 0,
        note: "",
      });
    } catch (error) {
      toast.error(error.message);
    }
  };
  const cols = [
    {
      key: "category",
      header: "Category",
      render: (r) => <span className="font-medium">{r.category}</span>,
    },
    { key: "vendor", header: "Vendor", render: (r) => r.vendor },
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
  ];
  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Operational and overhead spend"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add expense
          </Button>
        }
      />
      <DataTable
        rows={rows}
        columns={cols}
        searchKeys={["category", "vendor"]}
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        loading={loading}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add expense"
        description="Record a new expense entry"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Save expense</Button>
          </>
        }
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Field label="Category" required>
            <Select
              value={f.category}
              onChange={(e) => setF({ ...f, category: e.target.value })}
            >
              {[
                "Rent",
                "Utilities",
                "Salaries",
                "Marketing",
                "Logistics",
                "Travel",
                "Office Supplies",
                "Other",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Vendor" required>
            <Input
              value={f.vendor}
              onChange={(e) => setF({ ...f, vendor: e.target.value })}
              placeholder="Skyline Estates"
            />
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
          <div className="sm:col-span-2">
            <Field label="Note">
              <Input
                value={f.note}
                onChange={(e) => setF({ ...f, note: e.target.value })}
                placeholder="Optional notes"
              />
            </Field>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default ExpensesPage;
