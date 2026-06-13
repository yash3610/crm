import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
} from "@/components/common/Primitives";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InvoiceDocument } from "@/components/documents/InvoiceDocument";
import { useAuth } from "@/context/AuthContext";
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
  const { user } = useAuth();
  const [inv, setInvoice] = useState(
    invoices.find((item) => item.id === id) ?? invoices[0],
  );
  const [documentSettings, setDocumentSettings] = useState({
    business: {},
    invoice: defaultInvoiceSettings,
    print: defaultPrintSettings,
  });
  const [customer, setCustomer] = useState({});
  const [payments, setPayments] = useState([]);
  const [deletingPayment, setDeletingPayment] = useState("");
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/invoices/${id}`),
      api.get("/settings"),
      api.get("/payments"),
    ])
      .then(async ([invoice, settings, paymentRows]) => {
        setInvoice(invoice);
        setPayments(
          paymentRows.filter(
            (payment) =>
              (payment.invoiceNumber || payment.invoice) === invoice.number,
          ),
        );
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

  const deletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      setDeletingPayment(paymentToDelete.id);
      await api.delete(`/payments/${paymentToDelete.id}`);
      const [invoice, paymentRows] = await Promise.all([
        api.get(`/invoices/${id}`),
        api.get("/payments"),
      ]);
      setInvoice(invoice);
      setPayments(
        paymentRows.filter(
          (item) => (item.invoiceNumber || item.invoice) === invoice.number,
        ),
      );
      toast.success("Payment deleted and invoice balance updated");
      setPaymentToDelete(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingPayment("");
    }
  };

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
            payments={payments}
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
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Payment history</h3>
              <span className="text-xs text-muted-foreground">
                {payments.length} entries
              </span>
            </div>
            {payments.length ? (
              <div className="mt-4 space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {formatINR(payment.amount)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString("en-IN", {
                            dateStyle: "medium",
                          })}{" "}
                          · {payment.method.toUpperCase()}
                        </div>
                        {payment.reference && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Ref: {payment.reference}
                          </div>
                        )}
                      </div>
                      {["Owner", "Admin", "Accountant"].includes(
                        user?.role,
                      ) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={deletingPayment === payment.id}
                          onClick={() => setPaymentToDelete(payment)}
                          aria-label="Delete payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(paymentToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingPayment) setPaymentToDelete(null);
        }}
        title="Delete this payment?"
        description={
          paymentToDelete
            ? `${formatINR(paymentToDelete.amount)} will be removed. The invoice balance, payment status and customer outstanding will be recalculated.`
            : ""
        }
        confirmLabel="Yes, delete payment"
        loading={Boolean(deletingPayment)}
        onConfirm={deletePayment}
      />
    </>
  );
}

export default InvoiceDetail;
