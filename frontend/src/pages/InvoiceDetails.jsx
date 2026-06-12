import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
} from "@/components/common/Primitives";
import { invoices, formatINR } from "@/data/mock";
import { ArrowLeft, Download, Send, Printer } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { printDocument } from "@/lib/printDocument";
const sampleLines = [
  { name: "Premium Widget", qty: 12, price: 1499, gst: 18 },
  { name: "Industrial Gear 22mm", qty: 4, price: 899, gst: 18 },
  { name: "Stretch Film Roll", qty: 6, price: 320, gst: 12 },
];
function InvoiceDetail() {
  const { id } = useParams();
  const [inv, setInvoice] = useState(
    invoices.find((item) => item.id === id) ?? invoices[0],
  );
  const [documentSettings, setDocumentSettings] = useState({
    business: {},
    invoice: {
      accent: "#4f46e5",
      showBalance: true,
      showDescription: true,
      showPhone: true,
      showTime: false,
      showHsn: true,
      showDiscount: true,
      terms: "Payment is due within 14 days.",
    },
  });

  useEffect(() => {
    Promise.all([api.get(`/invoices/${id}`), api.get("/settings")])
      .then(([invoice, settings]) => {
        setInvoice(invoice);
        setDocumentSettings((current) => ({
          business: {
            ...(settings.company || {}),
            ...(settings.tax || {}),
            ...(settings.business || {}),
          },
          invoice: { ...current.invoice, ...(settings.invoice || {}) },
        }));
      })
      .catch((error) => toast.error(error.message));
  }, [id]);
  const lines = inv.lines?.length ? inv.lines : sampleLines;
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const gst = lines.reduce((s, l) => s + (l.qty * l.price * l.gst) / 100, 0);
  const total = subtotal + gst;
  const business = documentSettings.business;
  const invoiceSettings = documentSettings.invoice;
  return (
    <>
      <PageHeader
        title={inv.number}
        subtitle={`Issued ${new Date(inv.date).toLocaleDateString("en-IN", { dateStyle: "medium" })} · Due ${new Date(inv.dueDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}`}
        actions={
          <>
            <Link to="/invoices">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => printDocument(`${inv.number}-invoice`)}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              variant="outline"
              onClick={() => printDocument(`${inv.number}-invoice`)}
            >
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button
              onClick={() => {
                const subject = encodeURIComponent(`Invoice ${inv.number}`);
                const body = encodeURIComponent(
                  `Hello,\n\nPlease find invoice ${inv.number} for ${formatINR(inv.amount)}.\n\nRegards`,
                );
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
              }}
            >
              <Send className="h-4 w-4" /> Send
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <Card
          className="print-document overflow-hidden p-8"
          style={{ borderTop: `5px solid ${invoiceSettings.accent}` }}
        >
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                Tax invoice
              </div>
              <div className="text-2xl font-semibold mt-1">{inv.number}</div>
              <div className="mt-1">
                <StatusBadge status={inv.status} />
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold">
                {business.name || "Your Business"}
              </div>
              <div className="text-muted-foreground">
                {business.address || "Update business address in settings"}
              </div>
              {invoiceSettings.showPhone && business.phone && (
                <div className="text-muted-foreground">{business.phone}</div>
              )}
              {business.gstin && (
                <div className="text-muted-foreground">
                  GSTIN {business.gstin}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-border">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Billed to
              </div>
              <div className="font-semibold">{inv.customer}</div>
              <div className="text-sm text-muted-foreground">
                accounts@{inv.customer.toLowerCase().split(" ")[0]}.in
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Issue date
              </div>
              <div className="font-medium">
                {new Date(inv.date).toLocaleDateString("en-IN", {
                  dateStyle: "medium",
                })}
                {invoiceSettings.showTime && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(inv.createdAt || inv.date).toLocaleTimeString(
                      "en-IN",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Due date
              </div>
              <div className="font-medium">
                {new Date(inv.dueDate).toLocaleDateString("en-IN", {
                  dateStyle: "medium",
                })}
              </div>
            </div>
          </div>

          <table className="w-full text-sm mt-6">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 font-medium">Item</th>
                {invoiceSettings.showHsn && (
                  <th className="py-2 font-medium">HSN</th>
                )}
                <th className="py-2 font-medium text-right">Qty</th>
                <th className="py-2 font-medium text-right">Price</th>
                {invoiceSettings.showDiscount && (
                  <th className="py-2 font-medium text-right">Disc.</th>
                )}
                <th className="py-2 font-medium text-right">GST</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-3 font-medium">
                    {l.name}
                    {invoiceSettings.showDescription && (
                      <div className="text-xs font-normal text-muted-foreground">
                        {l.description || "Product or service"}
                      </div>
                    )}
                  </td>
                  {invoiceSettings.showHsn && (
                    <td className="py-3">{l.hsn || "-"}</td>
                  )}
                  <td className="py-3 text-right tabular-nums">{l.qty}</td>
                  <td className="py-3 text-right tabular-nums">
                    {formatINR(l.price)}
                  </td>
                  {invoiceSettings.showDiscount && (
                    <td className="py-3 text-right tabular-nums">
                      {l.discount || 0}%
                    </td>
                  )}
                  <td className="py-3 text-right tabular-nums">{l.gst}%</td>
                  <td className="py-3 text-right tabular-nums">
                    {formatINR(l.qty * l.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST</span>
                <span className="tabular-nums">{formatINR(gst)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold text-base">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(total)}</span>
              </div>
              {invoiceSettings.showBalance && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Balance due</span>
                  <span className="tabular-nums">{formatINR(inv.amount)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
            <div className="font-semibold text-foreground mb-1">Notes</div>
            {invoiceSettings.terms}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Payment status</h3>
            <div className="text-2xl font-semibold tabular-nums">
              {formatINR(inv.amount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total payable</p>
            <div className="mt-4">
              <StatusBadge status={inv.status} />
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Activity</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="font-medium">Invoice created</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(inv.date).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-info" />
                <div>
                  <div className="font-medium">Email sent</div>
                  <div className="text-xs text-muted-foreground">
                    Delivered to customer
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-warning" />
                <div>
                  <div className="font-medium">Reminder scheduled</div>
                  <div className="text-xs text-muted-foreground">
                    3 days before due
                  </div>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

export default InvoiceDetail;
