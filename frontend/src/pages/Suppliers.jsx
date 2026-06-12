import { useState } from "react";
import {
  PageHeader,
  Button,
  Modal,
  Field,
  Input,
} from "@/components/common/Primitives";
import { DataTable } from "@/components/common/DataTable";
import { suppliers as seed, formatINR } from "@/data/mock";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
function SuppliersPage() {
  const { rows, create } = useApiList("/suppliers", seed);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    contact: "",
    phone: "",
    city: "",
    payable: 0,
  });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Supplier name is required");
    try {
      await create({ ...f, payable: Number(f.payable) || 0 });
      toast.success(`Supplier "${f.name}" added`);
      setOpen(false);
      setF({ name: "", contact: "", phone: "", city: "", payable: 0 });
    } catch (error) {
      toast.error(error.message);
    }
  };
  const cols = [
    {
      key: "name",
      header: "Supplier",
      render: (r) => <span className="font-medium">{r.name}</span>,
    },
    { key: "contact", header: "Contact", render: (r) => r.contact || "—" },
    {
      key: "phone",
      header: "Phone",
      render: (r) => (
        <span className="text-muted-foreground">{r.phone || "—"}</span>
      ),
    },
    { key: "city", header: "City", render: (r) => r.city || "—" },
    {
      key: "payable",
      header: "Payable",
      className: "text-right tabular-nums",
      render: (r) => (
        <span
          className={
            r.payable > 0 ? "text-warning font-medium dark:text-warning" : ""
          }
        >
          {formatINR(r.payable)}
        </span>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Vendors and payables"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add supplier
          </Button>
        }
      />
      <DataTable
        rows={rows}
        columns={cols}
        searchKeys={["name", "city", "contact"]}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add supplier"
        description="Register a new vendor"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Save supplier</Button>
          </>
        }
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Field label="Supplier name" required>
            <Input
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              placeholder="Maven Components"
            />
          </Field>
          <Field label="Contact person">
            <Input
              value={f.contact}
              onChange={(e) => setF({ ...f, contact: e.target.value })}
              placeholder="R. Iyer"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
              placeholder="+91 90XXX XXXXX"
            />
          </Field>
          <Field label="City">
            <Input
              value={f.city}
              onChange={(e) => setF({ ...f, city: e.target.value })}
              placeholder="Pune"
            />
          </Field>
          <Field label="Opening payable (₹)">
            <Input
              type="number"
              value={f.payable}
              onChange={(e) => setF({ ...f, payable: Number(e.target.value) })}
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}

export default SuppliersPage;
