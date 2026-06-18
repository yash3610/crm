import { useMemo, useState } from "react";
import {
  PageHeader,
  Button,
  StatusBadge,
  Modal,
  Field,
  Input,
  Select,
} from "@/components/common/Primitives";
import { CategoryPicker } from "@/components/common/CategoryPicker";
import { DataTable } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { products as seed, formatINR } from "@/data/mock";
import { Plus, Download, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
import { downloadCsv } from "@/lib/downloadCsv";
const DEFAULT_PRODUCT_CATEGORIES = [
  "Widgets",
  "Hardware",
  "Packaging",
  "Textiles",
  "Consumables",
];
const emptyProductForm = {
  name: "",
  sku: "",
  hsn: "",
  category: "",
  price: 0,
  stock: 0,
  unit: "pcs",
  gst: 18,
};

function productToForm(product) {
  return {
    name: product.name || "",
    sku: product.sku || "",
    hsn: product.hsn || "",
    category: product.category || "",
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    unit: product.unit || "pcs",
    gst: Number(product.gst) || 0,
  };
}

function ProductsPage() {
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
  } = useApiList("/products", seed, { paginated: true });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [f, setF] = useState(emptyProductForm);
  const categoryOptions = useMemo(
    () =>
      [
        ...new Set([
          ...DEFAULT_PRODUCT_CATEGORIES,
          ...allRows.map((item) => item.category).filter(Boolean),
        ]),
      ].sort((a, b) => a.localeCompare(b)),
    [allRows],
  );
  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setF(emptyProductForm);
  };
  const openAdd = () => {
    setEditing(null);
    setF(emptyProductForm);
    setOpen(true);
  };
  const openEdit = (product) => {
    setEditing(product);
    setF(productToForm(product));
    setOpen(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    const category = f.category.trim();
    if (!f.name.trim() || !f.sku.trim() || !category)
      return toast.error("Name, SKU and category are required");
    const payload = {
      ...f,
      name: f.name.trim(),
      sku: f.sku.trim().toUpperCase(),
      hsn: f.hsn.trim().toUpperCase(),
      category,
      price: Number(f.price),
      stock: Number(f.stock),
      gst: Number(f.gst),
    };
    try {
      setSaving(true);
      if (editing) {
        await update(editing.id, payload);
        toast.success(`Product "${payload.name}" updated`);
      } else {
        await create(payload);
        toast.success(`Product "${payload.name}" added`);
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
      toast.success(`Product "${deleting.name}" deleted`);
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
      header: "Product",
      render: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-xs text-muted-foreground">{r.sku}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (r) => (
        <span className="text-muted-foreground">{r.category}</span>
      ),
    },
    {
      key: "hsn",
      header: "HSN/SAC",
      render: (r) => (
        <span className="text-muted-foreground">{r.hsn || "-"}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      className: "text-right tabular-nums",
      render: (r) => formatINR(r.price),
    },
    {
      key: "gst",
      header: "GST",
      className: "text-right",
      render: (r) => `${r.gst}%`,
    },
    {
      key: "stock",
      header: "Stock",
      className: "text-right tabular-nums",
      render: (r) => (
        <span
          className={
            r.stock === 0
              ? "text-destructive font-medium"
              : r.stock <= 10
                ? "text-warning font-medium"
                : ""
          }
        >
          {r.stock} {r.unit}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge
          status={r.stock === 0 ? "out" : r.stock <= 10 ? "low" : "ok"}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (product) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewing(product)}
            aria-label={`View ${product.name}`}
            title="View product"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(product)}
            aria-label={`Edit ${product.name}`}
            title="Edit product"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleting(product)}
            aria-label={`Delete ${product.name}`}
            title="Delete product"
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
        title="Products"
        subtitle="Manage your catalog, pricing and tax rates"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv("products.csv", allRows)}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </>
        }
      />
      <DataTable
        rows={rows}
        columns={cols}
        searchKeys={["name", "sku", "hsn", "category"]}
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        loading={loading}
      />
      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? "Edit product" : "Add product"}
        description={
          editing ? "Update product details" : "Add a new item to your catalog"
        }
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving
                ? "Saving..."
                : editing
                  ? "Update product"
                  : "Save product"}
            </Button>
          </>
        }
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Field label="Product name" required>
            <Input
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              placeholder="Premium Widget"
              autoFocus
            />
          </Field>
          <Field label="SKU" required>
            <Input
              value={f.sku}
              onChange={(e) => setF({ ...f, sku: e.target.value })}
              placeholder="BP-WIDGET-01"
            />
          </Field>
          <Field label="HSN/SAC code" hint="Used automatically on invoices">
            <Input
              value={f.hsn}
              onChange={(e) => setF({ ...f, hsn: e.target.value })}
              placeholder="e.g. 8471"
              maxLength={20}
              inputMode="numeric"
            />
          </Field>
          <Field label="Category">
            <CategoryPicker
              value={f.category}
              onChange={(category) => setF({ ...f, category })}
              options={categoryOptions}
              placeholder="Search or add category"
            />
          </Field>
          <Field label="Unit">
            <Select
              value={f.unit}
              onChange={(e) => setF({ ...f, unit: e.target.value })}
            >
              {["pcs", "kg", "L", "m", "pack", "roll", "sheet"].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </Select>
          </Field>
          <Field label="Selling price (₹)" required>
            <Input
              type="number"
              value={f.price}
              onChange={(e) => setF({ ...f, price: Number(e.target.value) })}
            />
          </Field>
          <Field label="GST %">
            <Select
              value={f.gst}
              onChange={(e) => setF({ ...f, gst: Number(e.target.value) })}
            >
              {[0, 5, 12, 18, 28].map((g) => (
                <option key={g} value={g}>
                  {g}%
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Opening stock">
            <Input
              type="number"
              value={f.stock}
              onChange={(e) => setF({ ...f, stock: Number(e.target.value) })}
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title="Product details"
        description={viewing?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewing(null)}>
              Close
            </Button>
            {viewing && (
              <Button
                onClick={() => {
                  const product = viewing;
                  setViewing(null);
                  openEdit(product);
                }}
              >
                <Pencil className="h-4 w-4" /> Edit product
              </Button>
            )}
          </>
        }
      >
        {viewing && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["SKU", viewing.sku],
              ["HSN/SAC", viewing.hsn],
              ["Category", viewing.category],
              ["Unit", viewing.unit],
              ["GST", `${Number(viewing.gst) || 0}%`],
              ["Price", formatINR(viewing.price)],
              ["Stock", `${viewing.stock} ${viewing.unit}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 font-medium">{value || "-"}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteLoading) setDeleting(null);
        }}
        title="Delete product?"
        description={
          deleting
            ? `${deleting.name} will be permanently deleted from your catalog.`
            : ""
        }
        confirmLabel="Delete product"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </>
  );
}

export default ProductsPage;
