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
  customers as customerSeed,
  formatINR,
  products as productSeed,
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

function NewQuotation() {
  const navigate = useNavigate();
  const { rows: customers } = useApiList("/customers", customerSeed);
  const { rows: products } = useApiList("/products", productSeed);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [number, setNumber] = useState(
    `QUO-${new Date().getFullYear()}-000001`,
  );
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validTill, setValidTill] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "Prices are valid until the quotation expiry date.",
  );
  const [lines, setLines] = useState([makeLine()]);

  const customer = customers.find((item) => item.id === customerId);

  useEffect(() => {
    let active = true;
    api
      .get("/quotations/next-number")
      .then((data) => {
        if (active) setNumber(data.number);
      })
      .catch(() => {
        if (active) {
          setNumber(`QUO-${new Date().getFullYear()}-000001`);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  const updateLine = (id, patch) =>
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  const addLine = () => setLines((current) => [...current, makeLine()]);
  const removeLine = (id) =>
    setLines((current) =>
      current.length === 1 ? current : current.filter((line) => line.id !== id),
    );

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

  const save = async () => {
    if (!customer) return toast.error("Select a customer");
    if (
      lines.some(
        (line) =>
          !line.productId || Number(line.qty) <= 0 || Number(line.price) < 0,
      )
    ) {
      return toast.error("Complete all item details");
    }
    try {
      setSaving(true);
      const quotation = await api.post("/quotations", {
        number,
        customerRef: customer.mongoId,
        customer: customer.name,
        date,
        validTill,
        status,
        notes,
        terms,
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
      toast.success(`Quotation ${quotation.number || number} created`);
      navigate(`/quotations/${quotation.id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Quotation"
        subtitle="Add products, pricing, tax and terms for the customer"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/quotations")}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save & Preview"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Quotation details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs font-medium text-muted-foreground">
                  Customer *
                </span>
                <Select
                  className="mt-1.5 w-full"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select customer
                  </option>
                  {customers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                <span className="text-xs font-medium text-muted-foreground">
                  Quotation number
                </span>
                <Input className="mt-1.5" value={number} readOnly />
              </label>
              <label>
                <span className="text-xs font-medium text-muted-foreground">
                  Issue date
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
                  Valid till
                </span>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={validTill}
                  min={date}
                  onChange={(event) => setValidTill(event.target.value)}
                />
              </label>
              <label>
                <span className="text-xs font-medium text-muted-foreground">
                  Status
                </span>
                <Select
                  className="mt-1.5 w-full"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                </Select>
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Items</h3>
              <Button size="sm" variant="outline" onClick={addLine}>
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </div>
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left font-medium">Item name *</th>
                    <th className="w-20 py-2 font-medium">Qty</th>
                    <th className="w-28 py-2 font-medium">Rate</th>
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
                              Select item
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
                        <td className="py-2 text-right font-medium">
                          {formatINR(amount)}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length === 1}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
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
            <h3 className="mb-4 font-semibold">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxable amount</span>
                <span>{formatINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST</span>
                <span>{formatINR(totals.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Grand total</span>
                <span>{formatINR(totals.subtotal + totals.tax)}</span>
              </div>
            </div>
          </Card>
          <Card className="space-y-4 p-5">
            <label className="block">
              <span className="text-sm font-semibold">Notes</span>
              <textarea
                className="mt-2 min-h-20 w-full rounded-lg border border-border bg-background p-3 text-sm"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Terms & conditions</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-lg border border-border bg-background p-3 text-sm"
                value={terms}
                onChange={(event) => setTerms(event.target.value)}
              />
            </label>
          </Card>
        </div>
      </div>
    </>
  );
}

export default NewQuotation;
