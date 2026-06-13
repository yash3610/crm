import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer, Send } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
} from "@/components/common/Primitives";
import { InvoiceDocument } from "@/components/documents/InvoiceDocument";
import { formatINR, invoices } from "@/data/mock";
import { api } from "@/lib/api";
import { printDocument } from "@/lib/printDocument";

const sampleLines = [
  { name: "Premium Widget", qty: 12, price: 1499, gst: 18 },
  { name: "Industrial Gear 22mm", qty: 4, price: 899, gst: 18 },
  { name: "Stretch Film Roll", qty: 6, price: 320, gst: 12 },
];

const defaultInvoiceSettings = {
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
};

const defaultPrintSettings = {
  theme: "invoice",
  showBalance: true,
  showDescription: true,
  showTime: false,
  showTaxBreakup: true,
  showSignature: true,
};

function InvoiceDetail() {
  const { id } = useParams();
  const [inv, setInvoice] = useState(
    invoices.find((item) => item.id === id) ?? invoices[0],
  );
  const [documentSettings, setDocumentSettings] = useState({
    business: {},
    invoice: defaultInvoiceSettings,
    print: defaultPrintSettings,
  });
  const [customer, setCustomer] = useState({});

  useEffect(() => {
    Promise.all([api.get(`/invoices/${id}`), api.get("/settings")])
      .then(async ([invoice, settings]) => {
        setInvoice(invoice);
        if (invoice.customerId) {
          setCustomer(await api.get(`/customers/${invoice.customerId}`));
        } else {
          setCustomer({ name: invoice.customerName || invoice.customer });
        }
        setDocumentSettings({
          business: {
            ...(settings.company || {}),
            ...(settings.tax || {}),
            ...(settings.business || {}),
          },
          invoice: {
            ...defaultInvoiceSettings,
            ...(settings.invoice || {}),
          },
          print: {
            ...defaultPrintSettings,
            ...(settings.print || {}),
          },
        });
      })
      .catch((error) => toast.error(error.message));
  }, [id]);

  const lines = inv.lines?.length ? inv.lines : sampleLines;
  const total =
    Number(inv.amount) ||
    lines.reduce((sum, line) => {
      const base = Number(line.qty) * Number(line.price);
      const taxable = base - (base * Number(line.discount || 0)) / 100;
      return sum + taxable * (1 + Number(line.gst || 0) / 100);
    }, 0);
  const balance = Math.max(0, total - Number(inv.paidAmount || 0));
  const renderedInvoice = { ...inv, lines, amount: total };
  const renderedSettings = {
    ...documentSettings.invoice,
    theme: "professional",
    showBalance: documentSettings.print.showBalance,
    showDescription: documentSettings.print.showDescription,
    showTime: documentSettings.print.showTime,
  };

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
                  `Hello,\n\nPlease find invoice ${inv.number} for ${formatINR(total)}.\n\nRegards`,
                );
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
              }}
            >
              <Send className="h-4 w-4" /> Send
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="print-document overflow-hidden p-0">
          <InvoiceDocument
            invoice={renderedInvoice}
            customer={customer}
            business={documentSettings.business}
            settings={renderedSettings}
            printSettings={documentSettings.print}
            compact={documentSettings.print.mode === "thermal"}
          />
        </Card>

        <div className="space-y-4 print-hidden">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Payment status</h3>
            <div className="text-2xl font-semibold tabular-nums">
              {formatINR(balance)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Balance due</p>
            <div className="mt-4">
              <StatusBadge status={inv.status} />
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Document settings</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Theme</dt>
                <dd>Professional</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Logo</dt>
                <dd>
                  {documentSettings.business.logo ? "Added" : "Not added"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Signature</dt>
                <dd>
                  {documentSettings.business.signature ? "Added" : "Not added"}
                </dd>
              </div>
            </dl>
            <Link to="/settings" className="mt-4 block">
              <Button variant="outline" className="w-full">
                Manage invoice settings
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}

export default InvoiceDetail;
