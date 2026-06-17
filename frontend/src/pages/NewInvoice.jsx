import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
} from "@/components/common/Primitives";
import { formatINR } from "@/data/mock";
import {
  Plus,
  Trash2,
  Save,
  Printer,
  Download,
  Share2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { InvoiceDocument } from "@/components/documents/InvoiceDocument";
import { useApiList } from "@/hooks/useApiList";
import { api } from "@/lib/api";
import { printDocument } from "@/lib/printDocument";

function makeRow(product) {
  return {
    id: crypto.randomUUID(),
    productId: product?.id || "",
    qty: 1,
    price: Number(product?.price) || 0,
    gst: Number(product?.gst) || 0,
    discount: 0,
  };
}

function CreateInvoice() {
  const navigate = useNavigate();
  const { rows: customers, loading: customersLoading } =
    useApiList("/customers");
  const { rows: products, loading: productsLoading } = useApiList("/products");
  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  );
  const [number, setNumber] = useState(
    `INV-${new Date().getFullYear()}-000001`,
  );
  const [documentSettings, setDocumentSettings] = useState({
    business: {},
    invoice: {
      theme: "professional",
      accent: "#4f46e5",
      showBalance: true,
      showDescription: true,
      showPhone: true,
      showTime: false,
      showHsn: true,
      showDiscount: true,
      showLogo: true,
      showSignature: true,
      showPaymentDetails: true,
      terms: "Payment is due within 14 days.",
    },
    print: {
      theme: "invoice",
      showBalance: true,
      showDescription: true,
      showTime: false,
      showTaxBreakup: true,
      showSignature: true,
    },
  });
  const [rows, setRows] = useState([makeRow()]);
  const update = (id, patch) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id) =>
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.id !== id)));
  const addRow = () => {
    setRows((rs) => [...rs, makeRow()]);
  };

  useEffect(() => {
    setCustomer((current) => {
      if (customers.some((item) => item.id === current)) return current;
      return "";
    });
  }, [customers]);

  useEffect(() => {
    setRows((current) => {
      if (!current.length) {
        return [makeRow()];
      }

      return current.map((row) => {
        if (products.some((product) => product.id === row.productId)) {
          return row;
        }
        return {
          ...row,
          productId: "",
          price: 0,
          gst: 0,
        };
      });
    });
  }, [products]);

  useEffect(() => {
    api
      .get("/invoices/next-number")
      .then((data) => setNumber(data.number))
      .catch((error) => toast.error(error.message));
  }, []);

  useEffect(() => {
    api
      .get("/settings")
      .then((settings) =>
        setDocumentSettings((current) => ({
          business: {
            ...(settings.company || {}),
            ...(settings.tax || {}),
            ...(settings.business || {}),
          },
          invoice: { ...current.invoice, ...(settings.invoice || {}) },
          print: { ...current.print, ...(settings.print || {}) },
        })),
      )
      .catch((error) => toast.error(error.message));
  }, []);
  const totals = useMemo(() => {
    let subtotal = 0,
      tax = 0,
      discount = 0;
    rows.forEach((r) => {
      const line = r.qty * r.price;
      const disc = (line * r.discount) / 100;
      const taxable = line - disc;
      const gst = (taxable * r.gst) / 100;
      subtotal += line;
      discount += disc;
      tax += gst;
    });
    return { subtotal, discount, tax, total: subtotal - discount + tax };
  }, [rows]);
  const cust = customers.find((c) => c.id === customer);
  const hasInvalidRows = rows.some(
    (row) => !row.productId || Number(row.qty) <= 0 || Number(row.price) < 0,
  );
  const canUseInvoice = Boolean(
    cust && rows.length && products.length && !hasInvalidRows,
  );
  const businessName =
    documentSettings.business.displayName ||
    documentSettings.business.name ||
    "Your Business";
  const businessAddress =
    [
      documentSettings.business.address,
      documentSettings.business.city,
      documentSettings.business.state,
      documentSettings.business.pincode,
    ]
      .filter(Boolean)
      .join(", ") || "Business address";
  const documentLines = rows.map((row) => {
    const product = products.find((item) => item.id === row.productId);
    return {
      ...row,
      name: product?.name || "Product",
      description: product?.category,
      hsn: product?.hsn,
    };
  });
  const renderedSettings = {
    ...documentSettings.invoice,
    theme: "professional",
    showBalance: documentSettings.print.showBalance,
    showDescription: documentSettings.print.showDescription,
    showTime: documentSettings.print.showTime,
  };
  const shareText = `Invoice ${number}\nCustomer: ${cust?.name || ""}\nTotal: ${formatINR(totals.total)}\nDue: ${dueDate}`;
  const openWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const openEmail = () => {
    const subject = encodeURIComponent(`Invoice ${number}`);
    const body = encodeURIComponent(
      `Hello ${cust?.name || ""},\n\n${shareText}\n\nRegards`,
    );
    window.location.href = `mailto:${cust?.email || ""}?subject=${subject}&body=${body}`;
  };
  const saveInvoice = async () => {
    if (!cust) {
      toast.error("Select a customer before saving the invoice");
      return;
    }
    if (!rows.length) {
      toast.error("Add at least one invoice item");
      return;
    }
    if (hasInvalidRows) {
      toast.error("Complete all invoice item details");
      return;
    }

    try {
      const invoice = await api.post("/invoices", {
        customer: cust?.mongoId,
        customerName: cust?.name,
        date,
        dueDate,
        status: "pending",
        lines: rows.map((row) => {
          const product = products.find((item) => item.id === row.productId);
          return {
            product: product?.mongoId,
            name: product?.name || "Product",
            qty: row.qty,
            price: row.price,
            gst: row.gst,
            discount: row.discount,
          };
        }),
      });
      setNumber(invoice.number);
      toast.success(`Invoice ${invoice.number} saved`);
      api
        .get("/invoices/next-number")
        .then((nextInvoice) => setNumber(nextInvoice.number))
        .catch(() => {
          const match = invoice.number.match(/^(INV-\d{4}-)(\d+)$/);
          if (!match) return;
          setNumber(
            `${match[1]}${String(Number(match[2]) + 1).padStart(6, "0")}`,
          );
        });
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <>
      <PageHeader
        title="Create invoice"
        subtitle="Build a new invoice with live totals"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => printDocument(`${number}-invoice`)}
              disabled={!canUseInvoice}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              variant="outline"
              onClick={() => printDocument(`${number}-invoice`)}
              disabled={!canUseInvoice}
            >
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              onClick={openWhatsApp}
              disabled={!canUseInvoice}
            >
              <Share2 className="h-4 w-4" /> WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={openEmail}
              disabled={!canUseInvoice}
            >
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button
              onClick={saveInvoice}
              disabled={!canUseInvoice || productsLoading}
            >
              <Save className="h-4 w-4" /> Save
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Bill to</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Customer *
                </label>
                <Select
                  className="mt-1 w-full"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  disabled={customersLoading || !customers.length}
                  required
                >
                  {customers.length > 0 && (
                    <option value="" disabled>
                      Select customer
                    </option>
                  )}
                  {!customers.length && (
                    <option value="">
                      {customersLoading
                        ? "Loading customers..."
                        : "No customers available"}
                    </option>
                  )}
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                {!customersLoading && !customers.length && (
                  <button
                    type="button"
                    onClick={() => navigate("/customers")}
                    className="mt-2 text-xs font-medium text-primary hover:underline"
                  >
                    Add your first customer
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Invoice date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-3 grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Invoice #
                </label>
                <Input value={number} readOnly className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Due date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Payment terms
                </label>
                <Select className="mt-1 w-full" defaultValue="net14">
                  <option value="net7">Net 7</option>
                  <option value="net14">Net 14</option>
                  <option value="net30">Net 30</option>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Items</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addRow}
                disabled={productsLoading || !products.length}
              >
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </div>
            {!productsLoading && !products.length && (
              <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm">
                <div className="font-medium">No products available</div>
                <p className="mt-1 text-muted-foreground">
                  Add a product before creating invoice items.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => navigate("/products")}
                >
                  <Plus className="h-4 w-4" /> Add product
                </Button>
              </div>
            )}
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 font-medium">Product *</th>
                    <th className="py-2 font-medium w-20">Qty</th>
                    <th className="py-2 font-medium w-28">Price</th>
                    <th className="py-2 font-medium w-20">GST %</th>
                    <th className="py-2 font-medium w-20">Disc %</th>
                    <th className="text-right py-2 font-medium">Total</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const line = r.qty * r.price;
                    const taxable = line - (line * r.discount) / 100;
                    const total = taxable + (taxable * r.gst) / 100;
                    return (
                      <tr
                        key={r.id}
                        className="border-t border-border align-middle"
                      >
                        <td className="py-2 pr-2">
                          <Select
                            className="w-full"
                            value={r.productId}
                            required
                            onChange={(e) => {
                              const p = products.find(
                                (p) => p.id === e.target.value,
                              );
                              if (!p) return;
                              update(r.id, {
                                productId: p.id,
                                price: p.price,
                                gst: p.gst,
                              });
                            }}
                          >
                            <option value="" disabled>
                              Select product
                            </option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            type="number"
                            min={1}
                            value={r.qty}
                            onChange={(e) =>
                              update(r.id, { qty: Number(e.target.value) || 0 })
                            }
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            type="number"
                            value={r.price}
                            onChange={(e) =>
                              update(r.id, {
                                price: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            type="number"
                            value={r.gst}
                            onChange={(e) =>
                              update(r.id, { gst: Number(e.target.value) || 0 })
                            }
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            type="number"
                            value={r.discount}
                            onChange={(e) =>
                              update(r.id, {
                                discount: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium">
                          {formatINR(total)}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => remove(r.id)}
                            disabled={rows.length === 1}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            type="button"
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
            <h3 className="font-semibold mb-4">Summary</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatINR(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="tabular-nums text-destructive">
                  −{formatINR(totals.discount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">GST</dt>
                <dd className="tabular-nums">{formatINR(totals.tax)}</dd>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-base font-semibold">
                <dt>Grand total</dt>
                <dd className="tabular-nums">{formatINR(totals.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Preview</h3>
            <div className="rounded-lg border border-dashed border-border p-4 text-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold">{businessName}</div>
                  <div className="text-xs text-muted-foreground">
                    {businessAddress}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">INVOICE</div>
                  <div className="font-medium">{number}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Bill to</div>
              <div className="font-medium">
                {cust?.name || "Select a customer"}
              </div>
              <div className="text-xs text-muted-foreground">
                {cust?.city || ""}
              </div>
              <div className="border-t border-border my-3" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(totals.total)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <section className="print-document hidden">
        <InvoiceDocument
          invoice={{
            number,
            date,
            dueDate,
            amount: totals.total,
            lines: documentLines,
          }}
          customer={cust || {}}
          business={documentSettings.business}
          settings={renderedSettings}
          printSettings={documentSettings.print}
          compact={documentSettings.print.mode === "thermal"}
        />
      </section>
    </>
  );
}

export default CreateInvoice;
