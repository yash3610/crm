import { formatINR } from "@/data/mock";
import { assetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB");
}

function calculateLine(line) {
  const base = Number(line.qty || 0) * Number(line.price ?? line.rate ?? 0);
  const discount = (base * Number(line.discount || 0)) / 100;
  const taxable = base - discount;
  const tax = (taxable * Number(line.gst ?? line.tax ?? 0)) / 100;
  return { base, discount, taxable, tax, total: taxable + tax };
}

export function InvoiceDocument({
  invoice,
  customer = {},
  business = {},
  settings = {},
  printSettings = {},
  payments = [],
  compact = false,
  className,
}) {
  const lines = invoice.lines || [];
  const accent = settings.accent || "#2563eb";
  const subtotal = lines.reduce(
    (sum, line) => sum + calculateLine(line).taxable,
    0,
  );
  const discount = lines.reduce(
    (sum, line) => sum + calculateLine(line).discount,
    0,
  );
  const tax = lines.reduce((sum, line) => sum + calculateLine(line).tax, 0);
  const total = Number(invoice.amount ?? subtotal + tax);
  const balance = Math.max(0, total - Number(invoice.paidAmount || 0));
  const taxRates = [
    ...new Set(lines.map((line) => Number(line.gst ?? line.tax ?? 0))),
  ].filter((rate) => rate > 0);
  const splitTaxLabel = taxRates.length === 1 ? ` ${taxRates[0] / 2}%` : "";
  const showSignature =
    settings.showSignature !== false && printSettings.showSignature !== false;
  const showTaxBreakup = printSettings.showTaxBreakup !== false;
  const hasPaymentDetails =
    business.bankName ||
    business.accountName ||
    business.accountNumber ||
    business.ifsc ||
    business.upiId;
  const address =
    [business.address, business.city, business.state, business.pincode]
      .filter(Boolean)
      .join(", ") || "Business address";

  return (
    <article
      className={cn(
        "invoice-document mx-auto flex w-full flex-col bg-white text-slate-800",
        compact
          ? "min-h-[620px] max-w-[340px] p-5 text-[9px]"
          : "min-h-[900px] max-w-[900px] p-4 text-[11px] sm:p-8 sm:text-sm lg:p-12",
        className,
      )}
    >
      <header className="invoice-header">
        <div
          className={cn(
            "invoice-title text-center font-extrabold leading-none tracking-tight text-black",
            compact ? "text-xl" : "text-2xl sm:text-4xl",
          )}
        >
          TAX INVOICE
        </div>

        <div className="invoice-identity mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="invoice-business flex min-w-0 items-start gap-3 sm:gap-5">
            {settings.showLogo !== false && (
              <div
                className={cn(
                  "grid shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white",
                  compact ? "h-12 w-12" : "h-14 w-14 sm:h-20 sm:w-20",
                )}
              >
                {business.logo ? (
                  <img
                    src={assetUrl(business.logo)}
                    alt={`${business.name || "Business"} logo`}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-slate-400">
                    Company Logo
                  </span>
                )}
              </div>
            )}

            <div className="invoice-business-details min-w-0 break-words">
              <h1
                className={cn(
                  "break-words font-bold leading-tight",
                  compact ? "text-base" : "text-xl sm:text-3xl",
                )}
                style={{ color: accent }}
              >
                {business.name || "Your Business"}
              </h1>
              <div className="mt-2 space-y-1 text-slate-500">
                <div>{address}</div>
                {settings.showPhone !== false && business.phone && (
                  <div>{business.phone}</div>
                )}
                {business.email && <div>{business.email}</div>}
                {business.gstin && (
                  <div className="font-bold text-slate-800">
                    GSTIN: {business.gstin}
                  </div>
                )}
                {business.pan && (
                  <div className="text-xs">PAN: {business.pan}</div>
                )}
              </div>
            </div>
          </div>

          <div className="invoice-meta min-w-0 rounded-xl bg-slate-50 p-3 sm:shrink-0 sm:text-right">
            <div className="space-y-1 text-slate-500">
              <div>
                Invoice No:{" "}
                <span className="text-slate-700">
                  {invoice.number || "INV-0001"}
                </span>
              </div>
              <div>Date: {formatDate(invoice.date)}</div>
              {invoice.dueDate && (
                <div>Due Date: {formatDate(invoice.dueDate)}</div>
              )}
              {settings.showTime && invoice.createdAt && (
                <div>
                  Time:{" "}
                  {new Date(invoice.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "invoice-divider mt-8 w-full",
            compact ? "h-1" : "h-[5px]",
          )}
          style={{ backgroundColor: accent }}
        />
      </header>

      <section
        className={cn(
          "invoice-party-grid grid gap-6",
          compact ? "mt-5" : "mt-9",
          settings.showPaymentDetails !== false
            ? compact
              ? "grid-cols-1"
              : "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1",
        )}
      >
        <div
          className={cn(
            "rounded-2xl border border-slate-200",
            compact ? "p-3" : "min-h-36 p-5",
          )}
        >
          <div
            className={cn("font-bold", compact ? "text-xs" : "text-lg")}
            style={{ color: accent }}
          >
            Bill To
          </div>
          <div className="mt-2 font-bold text-slate-900">
            {customer.name ||
              invoice.customerName ||
              invoice.customer ||
              "Customer"}
          </div>
          {customer.address && <div className="mt-1">{customer.address}</div>}
          {customer.city && <div className="mt-1">{customer.city}</div>}
          {settings.showPhone !== false && customer.phone && (
            <div className="mt-1">{customer.phone}</div>
          )}
          {customer.email && <div className="mt-1">{customer.email}</div>}
          {customer.gstin && (
            <div className="mt-1">GSTIN: {customer.gstin}</div>
          )}
        </div>

        {settings.showPaymentDetails !== false && (
          <div
            className={cn(
              "rounded-2xl border border-slate-200",
              compact ? "p-3" : "min-h-36 p-5",
            )}
          >
            <div
              className={cn("font-bold", compact ? "text-xs" : "text-lg")}
              style={{ color: accent }}
            >
              Payment Details
            </div>
            {hasPaymentDetails ? (
              <div className="mt-2 space-y-1">
                {business.bankName && <div>Bank: {business.bankName}</div>}
                {business.accountName && (
                  <div>Name: {business.accountName}</div>
                )}
                {business.accountNumber && (
                  <div>A/C No: {business.accountNumber}</div>
                )}
                {business.ifsc && <div>IFSC: {business.ifsc}</div>}
                {business.upiId && <div>UPI: {business.upiId}</div>}
              </div>
            ) : (
              <div className="mt-2 text-slate-400">
                Add bank details in Business Settings
              </div>
            )}
          </div>
        )}
      </section>

      <div
        className={cn(
          "invoice-items max-w-full overflow-x-auto overscroll-x-contain",
          compact ? "mt-5" : "mt-9",
        )}
      >
        <table
          className={cn("w-full border-collapse", !compact && "min-w-[680px]")}
        >
          <thead>
            <tr
              className="text-left font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              <th className={compact ? "p-2" : "p-4"}>#</th>
              <th className={compact ? "p-2" : "p-4"}>Item</th>
              {settings.showHsn !== false && (
                <th className={compact ? "p-2" : "p-4"}>HSN</th>
              )}
              <th className={cn(compact ? "p-2" : "p-4", "text-right")}>Qty</th>
              <th className={cn(compact ? "p-2" : "p-4", "text-right")}>
                Rate
              </th>
              {settings.showDiscount !== false && (
                <th className={cn(compact ? "p-2" : "p-4", "text-right")}>
                  Disc.
                </th>
              )}
              <th className={cn(compact ? "p-2" : "p-4", "text-right")}>
                GST %
              </th>
              <th className={cn(compact ? "p-2" : "p-4", "text-right")}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const calculated = calculateLine(line);
              return (
                <tr
                  key={line.id || `${line.name}-${index}`}
                  className="border-b border-slate-200"
                >
                  <td className={compact ? "p-2" : "p-4"}>{index + 1}</td>
                  <td className={cn(compact ? "p-2" : "p-4", "font-medium")}>
                    {line.name}
                    {settings.showDescription !== false && line.description && (
                      <div className="mt-1 text-xs font-normal text-slate-500">
                        {line.description}
                      </div>
                    )}
                  </td>
                  {settings.showHsn !== false && (
                    <td className={compact ? "p-2" : "p-4"}>
                      {line.hsn || "-"}
                    </td>
                  )}
                  <td className={cn(compact ? "p-2" : "p-4", "text-right")}>
                    {line.qty}
                  </td>
                  <td className={cn(compact ? "p-2" : "p-4", "text-right")}>
                    {formatINR(line.price ?? line.rate ?? 0)}
                  </td>
                  {settings.showDiscount !== false && (
                    <td className={cn(compact ? "p-2" : "p-4", "text-right")}>
                      {line.discount || 0}%
                    </td>
                  )}
                  <td className={cn(compact ? "p-2" : "p-4", "text-right")}>
                    {line.gst ?? line.tax ?? 0}%
                  </td>
                  <td
                    className={cn(
                      compact ? "p-2" : "p-4",
                      "text-right font-semibold",
                    )}
                  >
                    {formatINR(calculated.taxable)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section
        className={cn(
          "invoice-totals flex justify-end",
          compact ? "mt-5" : "mt-9",
        )}
      >
        <div
          className={cn(
            "invoice-totals-card w-full rounded-2xl border border-slate-200 bg-slate-50",
            compact ? "max-w-[220px] p-3" : "max-w-[330px] p-5",
          )}
        >
          <div className="flex justify-between py-1">
            <span>Subtotal</span>
            <strong>{formatINR(subtotal + discount)}</strong>
          </div>
          {settings.showDiscount !== false && discount > 0 && (
            <div className="flex justify-between py-1">
              <span>Discount</span>
              <strong>-{formatINR(discount)}</strong>
            </div>
          )}
          {showTaxBreakup ? (
            <>
              <div className="flex justify-between py-1">
                <span>CGST{splitTaxLabel}</span>
                <strong>{formatINR(tax / 2)}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>SGST{splitTaxLabel}</span>
                <strong>{formatINR(tax / 2)}</strong>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1">
              <span>GST</span>
              <strong>{formatINR(tax)}</strong>
            </div>
          )}
          <div
            className={cn(
              "mt-3 flex justify-between border-t-2 border-slate-300 pt-3 font-bold",
              compact ? "text-sm" : "text-xl",
            )}
            style={{ color: accent }}
          >
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          {settings.showBalance !== false && balance !== total && (
            <div className="mt-2 flex justify-between text-slate-600">
              <span>Balance Due</span>
              <strong>{formatINR(balance)}</strong>
            </div>
          )}
        </div>
      </section>

      {payments.length > 0 && (
        <section
          className={cn(
            "invoice-payment-history print-avoid-break",
            compact ? "mt-5" : "mt-9",
          )}
        >
          <div
            className={cn("font-bold", compact ? "text-xs" : "text-lg")}
            style={{ color: accent }}
          >
            Payment History
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className={compact ? "p-2" : "p-3"}>Date</th>
                  <th className={compact ? "p-2" : "p-3"}>Method</th>
                  <th className={compact ? "p-2" : "p-3"}>Reference</th>
                  <th className={cn(compact ? "p-2" : "p-3", "text-right")}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-slate-200">
                    <td className={compact ? "p-2" : "p-3"}>
                      {formatDate(payment.date)}
                    </td>
                    <td className={cn(compact ? "p-2" : "p-3", "uppercase")}>
                      {payment.method}
                    </td>
                    <td className={compact ? "p-2" : "p-3"}>
                      {payment.reference || "-"}
                    </td>
                    <td
                      className={cn(
                        compact ? "p-2" : "p-3",
                        "text-right font-semibold",
                      )}
                    >
                      {formatINR(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer
        className={cn(
          "invoice-footer print-avoid-break mt-auto grid items-end gap-10 pt-12",
          showSignature && !compact
            ? "grid-cols-1 sm:grid-cols-[1fr_260px]"
            : "grid-cols-1",
        )}
      >
        <div>
          <div
            className={cn("font-bold", compact ? "text-xs" : "text-lg")}
            style={{ color: accent }}
          >
            Terms & Conditions
          </div>
          <p className="mt-3 whitespace-pre-line text-slate-500">
            {settings.terms || invoice.notes || "Thank you for your business."}
          </p>
        </div>

        {showSignature && (
          <div className="text-center">
            {business.signature ? (
              <img
                src={assetUrl(business.signature)}
                alt="Authorized signature"
                className="mx-auto h-14 w-44 object-contain"
              />
            ) : (
              <div className="h-14" />
            )}
            <div className="border-t-2 border-slate-800 pt-2 font-bold text-slate-900">
              Authorized Signature
            </div>
          </div>
        )}
      </footer>
    </article>
  );
}
