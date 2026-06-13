import { useEffect, useMemo, useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
} from "@/components/common/Primitives";
import {
  customers as customerSeed,
  products as productSeed,
  formatINR,
} from "@/data/mock";
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
function CreateInvoice() {
  const { rows: customers } = useApiList("/customers", customerSeed);
  const { rows: products } = useApiList("/products", productSeed);
  const [customer, setCustomer] = useState(customerSeed[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  );
  const [number, setNumber] = useState(
    `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
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
  const [rows, setRows] = useState([
    {
      id: crypto.randomUUID(),
      productId: productSeed[0].id,
      qty: 1,
      price: productSeed[0].price,
      gst: productSeed[0].gst,
      discount: 0,
    },
  ]);
  const update = (id, patch) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const addRow = () => {
    const p = products[0];
    setRows((rs) => [
      ...rs,
      {
        id: crypto.randomUUID(),
        productId: p.id,
        qty: 1,
        price: p.price,
        gst: p.gst,
        discount: 0,
      },
    ]);
  };

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
    try {
      await api.post("/invoices", {
        number,
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
      toast.success("Invoice saved");
      setNumber(
        `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      );
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
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              variant="outline"
              onClick={() => printDocument(`${number}-invoice`)}
            >
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" onClick={openWhatsApp}>
              <Share2 className="h-4 w-4" /> WhatsApp
            </Button>
            <Button variant="outline" onClick={openEmail}>
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button onClick={saveInvoice}>
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
                  Customer
                </label>
                <Select
                  className="mt-1 w-full"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
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
                <Input
                  value={number}
                  onChange={(event) => setNumber(event.target.value)}
                  className="mt-1"
                />
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
              <Button size="sm" variant="outline" onClick={addRow}>
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </div>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 font-medium">Product</th>
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
                            onChange={(e) => {
                              const p = products.find(
                                (p) => p.id === e.target.value,
                              );
                              update(r.id, {
                                productId: p.id,
                                price: p.price,
                                gst: p.gst,
                              });
                            }}
                          >
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
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
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
                  <div className="font-semibold">BillPro Inc.</div>
                  <div className="text-xs text-muted-foreground">
                    12 MG Road, Bengaluru
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">INVOICE</div>
                  <div className="font-medium">INV-2026-1008</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Bill to</div>
              <div className="font-medium">{cust.name}</div>
              <div className="text-xs text-muted-foreground">{cust.city}</div>
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
          customer={cust}
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
