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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { customers as seed, formatINR } from "@/data/mock";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
import { downloadCsv } from "@/lib/downloadCsv";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  status: "active",
};

function cleanCustomerForm(form) {
  return {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim().replace(/\s+/g, " "),
    city: form.city.trim(),
    status: form.status,
  };
}

function validateCustomerForm(form) {
  if (!form.name) return "Customer name is required";
  if (form.name.length > 120) {
    return "Customer name cannot exceed 120 characters";
  }
  if (
    form.email &&
    (form.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
  ) {
    return "Enter a valid email address";
  }
  if (form.phone) {
    const digitCount = form.phone.replace(/\D/g, "").length;
    if (
      !/^\+?[\d\s().-]+$/.test(form.phone) ||
      digitCount < 7 ||
      digitCount > 15
    ) {
      return "Enter a valid phone number with 7 to 15 digits";
    }
  }
  if (form.city.length > 100) return "City cannot exceed 100 characters";
  return "";
}

function CustomersPage() {
  const {
    rows,
    allRows,
    loading,
    create,
    update,
    remove,
    pagination,
    setPage,
    setPageSize,
    setSearch,
  } = useApiList("/customers", seed, { paginated: true });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const reset = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const closeModal = () => {
    setOpen(false);
    reset();
  };

  const openAdd = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      city: customer.city || "",
      status: customer.status || "active",
    });
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = cleanCustomerForm(form);
    const validationError = validateCustomerForm(payload);
    if (validationError) return toast.error(validationError);

    try {
      setSaving(true);
      if (editing) {
        await update(editing.id, payload);
        toast.success(`Customer "${payload.name}" updated`);
      } else {
        await create(payload);
        toast.success(`Customer "${payload.name}" added`);
      }
      closeModal();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      setDeleteLoading(true);
      await remove(deleting.id);
      toast.success(`Customer "${deleting.name}" deleted`);
      setDeleting(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const cols = [
    {
      key: "name",
      header: "Customer",
      render: (customer) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent text-accent-foreground grid place-items-center text-xs font-semibold">
            {customer.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="text-xs text-muted-foreground">
              {customer.email || "-"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (customer) => (
        <span className="text-muted-foreground">{customer.phone || "-"}</span>
      ),
    },
    {
      key: "city",
      header: "City",
      render: (customer) => customer.city || "-",
    },
    {
      key: "totalBilled",
      header: "Billed",
      className: "text-right tabular-nums",
      render: (customer) => formatINR(customer.totalBilled),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      className: "text-right tabular-nums",
      render: (customer) => (
        <span
          className={
            customer.outstanding > 0 ? "text-destructive font-medium" : ""
          }
        >
          {formatINR(customer.outstanding)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (customer) => <StatusBadge status={customer.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (customer) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(customer)}
            aria-label={`Edit ${customer.name}`}
            title="Edit customer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleting(customer)}
            aria-label={`Delete ${customer.name}`}
            title="Delete customer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${pagination.total} customers in your directory`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv("customers.csv", allRows)}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add customer
            </Button>
          </>
        }
      />
      <DataTable
        rows={rows}
        columns={cols}
        searchKeys={["name", "email", "phone", "city"]}
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        loading={loading}
      />

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? "Edit customer" : "Add customer"}
        description={
          editing
            ? "Update customer contact details and status"
            : "Create a new customer record"
        }
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving
                ? "Saving..."
                : editing
                  ? "Update customer"
                  : "Save customer"}
            </Button>
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
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Acme Traders"
              maxLength={120}
              autoFocus
            />
          </Field>
          <Field label="Email" hint="Example: billing@acme.in">
            <Input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="billing@acme.in"
              maxLength={254}
              autoComplete="email"
            />
          </Field>
          <Field label="Phone" hint="7 to 15 digits; country code is allowed">
            <Input
              type="tel"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              placeholder="+91 98765 43210"
              inputMode="tel"
              autoComplete="tel"
              maxLength={30}
            />
          </Field>
          <Field label="City">
            <Input
              value={form.city}
              onChange={(event) =>
                setForm({ ...form, city: event.target.value })
              }
              placeholder="Mumbai"
              maxLength={100}
              autoComplete="address-level2"
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteLoading) setDeleting(null);
        }}
        title="Delete customer?"
        description={
          deleting
            ? `${deleting.name} will be permanently deleted. Customers with invoices or quotations cannot be deleted.`
            : ""
        }
        confirmLabel="Delete customer"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </>
  );
}

export default CustomersPage;
