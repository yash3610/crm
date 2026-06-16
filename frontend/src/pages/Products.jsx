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
import { products as seed, formatINR } from "@/data/mock";
import { Plus, Download } from "lucide-react";
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
function ProductsPage() {
  const {
    rows,
    allRows,
    loading,
    create,
    pagination,
    setPage,
    setPageSize,
    setSearch,
  } = useApiList("/products", seed, { paginated: true });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    sku: "",
    category: "",
    price: 0,
    stock: 0,
    unit: "pcs",
    gst: 18,
  });
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
  const submit = async (e) => {
    e.preventDefault();
    const category = f.category.trim();
    if (!f.name.trim() || !f.sku.trim() || !category)
      return toast.error("Name, SKU and category are required");
    try {
      await create({
        ...f,
        category,
        price: Number(f.price),
        stock: Number(f.stock),
        gst: Number(f.gst),
      });
      toast.success(`Product "${f.name}" added`);
      setOpen(false);
      setF({
        name: "",
        sku: "",
        category: "",
        price: 0,
        stock: 0,
        unit: "pcs",
        gst: 18,
      });
    } catch (error) {
      toast.error(error.message);
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
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </>
        }
      />
      <DataTable
        rows={rows}
        columns={cols}
        searchKeys={["name", "sku", "category"]}
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        loading={loading}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add product"
        description="Add a new item to your catalog"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Save product</Button>
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
            />
          </Field>
          <Field label="SKU" required>
            <Input
              value={f.sku}
              onChange={(e) => setF({ ...f, sku: e.target.value })}
              placeholder="BP-WIDGET-01"
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
    </>
  );
}

export default ProductsPage;
