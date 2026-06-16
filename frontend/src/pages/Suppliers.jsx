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
import {
  CONTACT_LIMITS,
  normalizeName,
  normalizePhone,
  validateName,
  validatePhone,
} from "@/lib/contactValidation";

const emptyForm = {
  name: "",
  contact: "",
  phone: "",
  city: "",
  payable: 0,
};

function cleanSupplierForm(form) {
  return {
    name: normalizeName(form.name),
    contact: normalizeName(form.contact),
    phone: normalizePhone(form.phone),
    city: form.city.trim(),
    payable: Number(form.payable) || 0,
  };
}

function validateSupplierForm(form) {
  const nameError = validateName(form.name, "Supplier name");
  if (nameError) return nameError;
  if (form.contact.length > CONTACT_LIMITS.name) {
    return `Contact person cannot exceed ${CONTACT_LIMITS.name} characters`;
  }
  const phoneError = validatePhone(form.phone);
  if (phoneError) return phoneError;
  if (form.city.length > CONTACT_LIMITS.city) {
    return `City cannot exceed ${CONTACT_LIMITS.city} characters`;
  }
  return "";
}

function SuppliersPage() {
  const { rows, loading, create, pagination, setPage, setPageSize, setSearch } =
    useApiList("/suppliers", seed, { paginated: true });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(emptyForm);
  const submit = async (e) => {
    e.preventDefault();
    const payload = cleanSupplierForm(f);
    const validationError = validateSupplierForm(payload);
    if (validationError) return toast.error(validationError);
    try {
      await create(payload);
      toast.success(`Supplier "${payload.name}" added`);
      setOpen(false);
      setF(emptyForm);
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
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        loading={loading}
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
              maxLength={CONTACT_LIMITS.name}
            />
          </Field>
          <Field label="Contact person">
            <Input
              value={f.contact}
              onChange={(e) => setF({ ...f, contact: e.target.value })}
              placeholder="R. Iyer"
              maxLength={CONTACT_LIMITS.name}
            />
          </Field>
          <Field label="Phone" hint="7 to 15 digits; country code is allowed">
            <Input
              type="tel"
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
              placeholder="+91 90XXX XXXXX"
              inputMode="tel"
              autoComplete="tel"
              maxLength={CONTACT_LIMITS.phone}
            />
          </Field>
          <Field label="City">
            <Input
              value={f.city}
              onChange={(e) => setF({ ...f, city: e.target.value })}
              placeholder="Pune"
              maxLength={CONTACT_LIMITS.city}
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
