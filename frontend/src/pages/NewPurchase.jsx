import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Card,
  Input,
  PageHeader,
  Select,
} from "@/components/common/Primitives";
import {
  formatINR,
  products as productSeed,
  suppliers as supplierSeed,
} from "@/data/mock";
import { useApiList } from "@/hooks/useApiList";
import { api } from "@/lib/api";

function makeLine(product) {
  return {
    id: crypto.randomUUID(),
    productId: product?.id || "",
    qty: 1,
    price: Number(product?.price) || 0,
    gst: Number(product?.gst) || 0,
    discount: 0,
  };
}

function NewPurchase() {
  const navigate = useNavigate();
  const { rows: suppliers } = useApiList("/suppliers", supplierSeed);
  const { rows: products } = useApiList("/products", productSeed);
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [number, setNumber] = useState(
    `PUR-${new Date().getFullYear()}-000001`,
  );
  const [supplierBillNumber, setSupplierBillNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  );
  const status = "pending";
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([makeLine()]);

  const selectedSupplier = suppliers.find(
    (supplier) => supplier.id === supplierId,
  );

  useEffect(() => {
    let active = true;
    api
      .get("/purchases/next-number")
      .then((data) => {
        if (active) setNumber(data.number);
      })
      .catch(() => {
        if (active) {
          setNumber(`PUR-${new Date().getFullYear()}-000001`);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const updateLine = (id, patch) => {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  };

  const addLine = () => setLines((current) => [...current, makeLine()]);

  const removeLine = (id) => {
    setLines((current) =>
      current.length === 1 ? current : current.filter((line) => line.id !== id),
    );
  };

  const totals = useMemo(
    () =>
      lines.reduce(
        (result, line) => {
          const base = Number(line.qty) * Number(line.price);
          const discount = (base * Number(line.discount || 0)) / 100;
          const taxable = base - discount;
          result.subtotal += taxable;
          result.tax += (taxable * Number(line.gst || 0)) / 100;
          return result;
        },
        { subtotal: 0, tax: 0 },
      ),
    [lines],
  );
  const grandTotal = totals.subtotal + totals.tax;

  const savePurchase = async () => {
    if (!selectedSupplier) return toast.error("Select a supplier");
    if (!supplierBillNumber.trim()) {
      return toast.error("Supplier bill number is required");
    }
    if (
      lines.some(
        (line) =>
          !line.productId || Number(line.qty) <= 0 || Number(line.price) < 0,
      )
    ) {
      return toast.error("Complete all purchase item details");
    }

    setSaving(true);
    try {
      const purchase = await api.post("/purchases", {
        number,
        supplierRef: selectedSupplier.mongoId,
        supplier: selectedSupplier.name,
        supplierBillNumber: supplierBillNumber.trim(),
        date,
        dueDate,
        status,
        notes,
        lines: lines.map((line) => {
          const product = products.find((item) => item.id === line.productId);
          return {
            product: product?.mongoId,
            name: product?.name || "Product",
            qty: Number(line.qty),
            price: Number(line.price),
            gst: Number(line.gst),
            discount: Number(line.discount),
          };
        }),
      });
      toast.success(`Purchase bill ${purchase.number || number} saved`);
      navigate("/purchases");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Purchase Bill"
        subtitle="Record the supplier invoice received against your purchase"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/purchases")}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={savePurchase} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Purchase Bill"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Supplier bill details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs font-medium text-muted-foreground">
                  Supplier *
                </span>
                <Select
                  className="mt-1.5 w-full"
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select supplier
                  </option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                <span className="text-xs font-medium text-muted-foreground">
                  Supplier invoice / bill number *
                </span>
                <Input
                  className="mt-1.5"
                  value={supplierBillNumber}
                  onChange={(event) =>
                    setSupplierBillNumber(event.target.value)
                  }
                  placeholder="e.g. SUP-INV-1042"
                />
              </label>
              <label>
                <span className="text-xs font-medium text-muted-foreground">
                  Purchase number
                </span>
                <Input className="mt-1.5" value={number} readOnly />
              </label>
              <label>
                <span className="text-xs font-medium text-muted-foreground">
                  Bill status
                </span>
                <Input className="mt-1.5" value="Payment pending" readOnly />
              </label>
              <label>
                <span className="text-xs font-medium text-muted-foreground">
                  Bill date
                </span>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
              <label>
                <span className="text-xs font-medium text-muted-foreground">
                  Payment due date
                </span>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Purchased items</h3>
              <Button size="sm" variant="outline" onClick={addLine}>
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </div>
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left font-medium">Product *</th>
                    <th className="w-20 py-2 font-medium">Qty</th>
                    <th className="w-28 py-2 font-medium">Purchase rate</th>
                    <th className="w-20 py-2 font-medium">GST %</th>
                    <th className="w-20 py-2 font-medium">Disc %</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const base = line.qty * line.price;
                    const taxable = base - (base * line.discount) / 100;
                    const amount = taxable + (taxable * line.gst) / 100;
                    return (
                      <tr key={line.id} className="border-t border-border">
                        <td className="py-2 pr-2">
                          <Select
                            className="w-full"
                            value={line.productId}
                            required
                            onChange={(event) => {
                              const product = products.find(
                                (item) => item.id === event.target.value,
                              );
                              updateLine(line.id, {
                                productId: product?.id || "",
                                price: Number(product?.price) || 0,
                                gst: Number(product?.gst) || 0,
                              });
                            }}
                          >
                            <option value="" disabled>
                              Select product
                            </option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </Select>
                        </td>
                        {["qty", "price", "gst", "discount"].map((field) => (
                          <td key={field} className="py-2 pr-2">
                            <Input
                              type="number"
                              min={field === "qty" ? 1 : 0}
                              max={
                                field === "gst" || field === "discount"
                                  ? 100
                                  : undefined
                              }
                              value={line[field]}
                              onChange={(event) =>
                                updateLine(line.id, {
                                  [field]: Number(event.target.value) || 0,
                                })
                              }
                            />
                          </td>
                        ))}
                        <td className="py-2 text-right font-medium tabular-nums">
                          {formatINR(amount)}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length === 1}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Bill summary</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Taxable amount</dt>
                <dd>{formatINR(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">GST</dt>
                <dd>{formatINR(totals.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Grand total</dt>
                <dd>{formatINR(grandTotal)}</dd>
              </div>
            </dl>
          </Card>
          <Card className="p-5">
            <label>
              <span className="text-sm font-semibold">Notes</span>
              <textarea
                className="mt-3 min-h-28 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={1000}
                placeholder="Transport, delivery or payment notes"
              />
            </label>
          </Card>
        </div>
      </div>
    </>
  );
}

export default NewPurchase;
