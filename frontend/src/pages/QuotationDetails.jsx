import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Mail,
  MessageCircle,
  Printer,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
} from "@/components/common/Primitives";
import { formatINR } from "@/data/mock";
import { api } from "@/lib/api";
import { printDocument } from "@/lib/printDocument";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function badgeStatus(status) {
  if (status === "accepted") return "paid";
  if (status === "expired") return "overdue";
  if (status === "sent") return "pending";
  return "draft";
}

function QuotationDetails() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [business, setBusiness] = useState({});

  useEffect(() => {
    Promise.all([api.get(`/quotations/${id}`), api.get("/settings")])
      .then(([quote, settings]) => {
        setQuotation(quote);
        setBusiness({
          ...(settings.company || {}),
          ...(settings.tax || {}),
          ...(settings.business || {}),
        });
      })
      .catch((error) => toast.error(error.message));
  }, [id]);

  const totals = useMemo(() => {
    if (!quotation) return { subtotal: 0, tax: 0, total: 0 };
    if (!quotation.lines?.length) {
      return {
        subtotal: Number(quotation.subtotal || quotation.amount || 0),
        tax: Number(quotation.tax || 0),
        total: Number(quotation.amount || 0),
      };
    }
    return quotation.lines.reduce(
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
  }, [quotation]);

  if (!quotation) {
    return (
      <div className="py-20 text-center text-muted-foreground">Loading...</div>
    );
  }

  const itemText = (quotation.lines || [])
    .map(
      (line, index) =>
        `${index + 1}. ${line.name} - ${line.qty} x ${formatINR(line.price)}`,
    )
    .join("\n");
  const shareText = [
    `Quotation ${quotation.number}`,
    `Customer: ${quotation.customer}`,
    `Valid till: ${formatDate(quotation.validTill)}`,
    "",
    itemText,
    "",
    `Total: ${formatINR(quotation.amount)}`,
  ].join("\n");

  const nativeShare = async () => {
    try {
      if (!navigator.share) {
        await navigator.clipboard.writeText(shareText);
        toast.success("Quotation details copied");
        return;
      }
      await navigator.share({
        title: `Quotation ${quotation.number}`,
        text: shareText,
      });
    } catch (error) {
      if (error.name !== "AbortError") toast.error("Unable to share quotation");
    }
  };

  return (
    <>
      <PageHeader
        title={quotation.number}
        subtitle={`Quotation for ${quotation.customer} · Valid till ${formatDate(quotation.validTill)}`}
        actions={
          <>
            <Link to="/quotations">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => printDocument(`${quotation.number}-quotation`)}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              variant="outline"
              onClick={() => printDocument(`${quotation.number}-quotation`)}
            >
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(shareText)}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = `mailto:?subject=${encodeURIComponent(`Quotation ${quotation.number}`)}&body=${encodeURIComponent(shareText)}`;
              }}
            >
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button onClick={nativeShare}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <Card className="print-document overflow-hidden border-t-4 border-t-primary p-8">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                Quotation
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {quotation.number}
              </div>
              <div className="mt-2">
                <StatusBadge status={badgeStatus(quotation.status)} />
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold">
                {business.name || "Your Business"}
              </div>
              {business.address && <div>{business.address}</div>}
              {business.phone && <div>{business.phone}</div>}
              {business.gstin && <div>GSTIN {business.gstin}</div>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 border-b border-border pb-6">
            <div>
              <div className="text-xs uppercase text-muted-foreground">
                Quotation for
              </div>
              <div className="mt-1 font-semibold">{quotation.customer}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">
                Issue date
              </div>
              <div className="mt-1 font-medium">
                {formatDate(quotation.date)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">
                Valid till
              </div>
              <div className="mt-1 font-medium">
                {formatDate(quotation.validTill)}
              </div>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Item name</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Discount</th>
                <th className="py-2 text-right">GST</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(quotation.lines || []).map((line, index) => {
                const base = line.qty * line.price;
                const taxable =
                  base - (base * Number(line.discount || 0)) / 100;
                const amount = taxable * (1 + Number(line.gst || 0) / 100);
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
              {!quotation.lines?.length && (
                <tr className="border-t border-border">
                  <td className="py-4 text-muted-foreground" colSpan={5}>
                    Item details are not available for this older quotation.
                  </td>
                  <td className="py-4 text-right font-medium">
                    {formatINR(quotation.amount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-8 ml-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Taxable amount</span>
              <span>{formatINR(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST</span>
              <span>{formatINR(totals.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Grand total</span>
              <span>{formatINR(totals.total)}</span>
            </div>
          </div>

          {(quotation.notes || quotation.terms) && (
            <div className="mt-10 grid gap-6 border-t border-border pt-6 text-sm sm:grid-cols-2">
              <div>
                <div className="mb-1 font-semibold">Notes</div>
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {quotation.notes || "-"}
                </div>
              </div>
              <div>
                <div className="mb-1 font-semibold">Terms & conditions</div>
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {quotation.terms || "-"}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="h-fit p-5">
          <h3 className="mb-4 font-semibold">Quotation summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items</span>
              <span>{quotation.lines?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">
                {formatINR(quotation.amount)}
              </span>
            </div>
            <div className="border-t border-border pt-3">
              <StatusBadge status={badgeStatus(quotation.status)} />
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export default QuotationDetails;
