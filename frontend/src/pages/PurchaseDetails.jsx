import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  LoaderCircle,
  Mail,
  MessageCircle,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
} from "@/components/common/Primitives";
import { DetailPageSkeleton } from "@/components/common/LoadingSkeletons";
import { formatINR } from "@/data/mock";
import { usePdfDownload } from "@/hooks/usePdfDownload";
import { api } from "@/lib/api";
import { printDocument } from "@/lib/printDocument";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function PurchaseDetails() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [business, setBusiness] = useState({});
  const { pdfDownloading, startPdfDownload } = usePdfDownload();

  useEffect(() => {
    Promise.all([api.get(`/purchases/${id}`), api.get("/settings")])
      .then(([bill, settings]) => {
        setPurchase(bill);
        setBusiness({
          ...(settings.company || {}),
          ...(settings.tax || {}),
          ...(settings.business || {}),
        });
      })
      .catch((error) => toast.error(error.message));
  }, [id]);

  const totals = useMemo(() => {
    if (!purchase) return { subtotal: 0, tax: 0, total: 0 };
    if (purchase.lines?.length) {
      return purchase.lines.reduce(
        (result, line) => {
          const base = Number(line.qty) * Number(line.price);
          const discount = (base * Number(line.discount || 0)) / 100;
          const taxable = base - discount;
          result.subtotal += taxable;
          result.tax += (taxable * Number(line.gst || 0)) / 100;
          result.total = result.subtotal + result.tax;
          return result;
        },
        { subtotal: 0, tax: 0, total: 0 },
      );
    }
    return {
      subtotal: Number(purchase.subtotal || purchase.amount),
      tax: Number(purchase.tax || 0),
      total: Number(purchase.amount || 0),
    };
  }, [purchase]);

  if (!purchase) {
    return <DetailPageSkeleton document />;
  }

  const outstanding = Math.max(
    0,
    Number(purchase.amount) - Number(purchase.paidAmount || 0),
  );
  const shareText = [
    `Purchase Bill: ${purchase.number}`,
    `Supplier invoice: ${purchase.supplierBillNumber || "-"}`,
    `Supplier: ${purchase.supplier}`,
    `Bill date: ${formatDate(purchase.date)}`,
    `Total: ${formatINR(purchase.amount)}`,
    `Paid: ${formatINR(purchase.paidAmount || 0)}`,
    `Balance: ${formatINR(outstanding)}`,
  ].join("\n");

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Purchase Bill ${purchase.number}`);
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(shareText)}`;
  };

  return (
    <>
      <PageHeader
        title={purchase.number}
        subtitle={`Supplier bill ${purchase.supplierBillNumber || "-"} · ${formatDate(purchase.date)}`}
        actions={
          <>
            <Link to="/purchases">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => printDocument(`${purchase.number}-purchase-bill`)}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                startPdfDownload(`${purchase.number}-purchase-bill`)
              }
              disabled={pdfDownloading}
            >
              {pdfDownloading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {pdfDownloading ? "Preparing..." : "PDF"}
            </Button>
            <Button variant="outline" onClick={shareWhatsApp}>
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
            <Button onClick={shareEmail}>
              <Mail className="h-4 w-4" /> Email
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="print-document overflow-hidden border-t-4 border-t-primary p-8">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                Purchase Bill
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {purchase.number}
              </div>
              <div className="mt-2">
                <StatusBadge status={purchase.status} />
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold">
                {business.name || "Your Business"}
              </div>
              {business.address && (
                <div className="text-muted-foreground">{business.address}</div>
              )}
              {business.phone && (
                <div className="text-muted-foreground">{business.phone}</div>
              )}
              {business.gstin && (
                <div className="text-muted-foreground">
                  GSTIN {business.gstin}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 border-b border-border pb-6 sm:grid-cols-4">
            <div>
              <div className="mb-1 text-xs uppercase text-muted-foreground">
                Supplier
              </div>
              <div className="font-semibold">{purchase.supplier}</div>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase text-muted-foreground">
                Supplier bill #
              </div>
              <div className="font-medium">
                {purchase.supplierBillNumber || "-"}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase text-muted-foreground">
                Bill date
              </div>
              <div className="font-medium">{formatDate(purchase.date)}</div>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase text-muted-foreground">
                Due date
              </div>
              <div className="font-medium">{formatDate(purchase.dueDate)}</div>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Rate</th>
                <th className="py-2 text-right font-medium">Discount</th>
                <th className="py-2 text-right font-medium">GST</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(purchase.lines || []).map((line, index) => {
                const base = Number(line.qty) * Number(line.price);
                const taxable =
                  base - (base * Number(line.discount || 0)) / 100;
                const amount =
                  taxable + (taxable * Number(line.gst || 0)) / 100;
                return (
                  <tr
                    key={`${line.name}-${index}`}
                    className="border-t border-border"
                  >
                    <td className="py-3 font-medium">{line.name}</td>
                    <td className="py-3 text-right">{line.qty}</td>
                    <td className="py-3 text-right">{formatINR(line.price)}</td>
                    <td className="py-3 text-right">{line.discount || 0}%</td>
                    <td className="py-3 text-right">{line.gst || 0}%</td>
                    <td className="py-3 text-right font-medium">
                      {formatINR(amount)}
                    </td>
                  </tr>
                );
              })}
              {!purchase.lines?.length && (
                <tr className="border-t border-border">
                  <td className="py-4 text-muted-foreground" colSpan={5}>
                    Item details are not available for this older purchase.
                  </td>
                  <td className="py-4 text-right font-medium">
                    {formatINR(purchase.amount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-8 ml-auto w-full max-w-xs space-y-2 text-sm">
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
              <span>{formatINR(totals.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Paid</span>
              <span>{formatINR(purchase.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between font-semibold text-primary">
              <span>Balance</span>
              <span>{formatINR(outstanding)}</span>
            </div>
          </div>

          {purchase.notes && (
            <div className="mt-10 border-t border-border pt-6 text-sm">
              <div className="mb-1 font-semibold">Notes</div>
              <div className="whitespace-pre-wrap text-muted-foreground">
                {purchase.notes}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Payment summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bill total</span>
                <span className="font-medium">
                  {formatINR(purchase.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span>{formatINR(purchase.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="font-medium">Balance</span>
                <span className="font-semibold text-primary">
                  {formatINR(outstanding)}
                </span>
              </div>
              <StatusBadge status={purchase.status} />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Payment history</h3>
            {purchase.payments?.length ? (
              <div className="space-y-3">
                {purchase.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium uppercase">
                        {payment.method}
                      </span>
                      <span className="font-semibold">
                        {formatINR(payment.amount)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDate(payment.date)}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No supplier payments recorded yet.
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export default PurchaseDetails;
