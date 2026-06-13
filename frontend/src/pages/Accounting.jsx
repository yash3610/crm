import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  BookOpen,
  Download,
  Landmark,
  Scale,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  Select,
} from "@/components/common/Primitives";
import { StatCard } from "@/components/common/StatCard";
import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/common/LoadingSkeletons";
import { formatINR } from "@/data/mock";
import { useApiList } from "@/hooks/useApiList";
import { downloadCsv } from "@/lib/downloadCsv";

const periodLabels = {
  all: "All time",
  month: "This month",
  lastMonth: "Last month",
  quarter: "This quarter",
  year: "This financial year",
};

function number(value) {
  return Number(value || 0);
}

function isPosted(item) {
  return !["draft", "cancelled"].includes(item.status);
}

function getPeriodBounds(period) {
  if (period === "all") return null;

  const now = new Date();
  let start;
  let end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "lastMonth") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else if (period === "quarter") {
    start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  } else {
    const financialYear =
      now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    start = new Date(financialYear, 3, 1);
  }

  return { start, end };
}

function inPeriod(value, bounds) {
  if (!bounds) return true;
  const date = new Date(value);
  return date >= bounds.start && date <= bounds.end;
}

function journalLine({
  id,
  date,
  account,
  type,
  reference,
  description,
  debit = 0,
  credit = 0,
}) {
  return {
    id,
    date,
    account,
    type,
    reference,
    description,
    debit,
    credit,
  };
}

function buildJournal(invoices, payments, expenses, purchases) {
  const entries = [];

  invoices.filter(isPosted).forEach((invoice) => {
    const reference = invoice.number || invoice.id;
    const amount = number(invoice.amount);
    const subtotal =
      number(invoice.subtotal) || Math.max(0, amount - number(invoice.tax));
    const tax = number(invoice.tax);

    entries.push(
      journalLine({
        id: `invoice-${invoice.id}-receivable`,
        date: invoice.date,
        account: "Accounts Receivable",
        type: "Asset",
        reference,
        description:
          invoice.customerName || invoice.customer || "Customer invoice",
        debit: amount,
      }),
      journalLine({
        id: `invoice-${invoice.id}-sales`,
        date: invoice.date,
        account: "Sales Revenue",
        type: "Income",
        reference,
        description:
          invoice.customerName || invoice.customer || "Customer invoice",
        credit: subtotal,
      }),
    );
    if (tax) {
      entries.push(
        journalLine({
          id: `invoice-${invoice.id}-tax`,
          date: invoice.date,
          account: "Output GST Payable",
          type: "Liability",
          reference,
          description: "GST collected on sale",
          credit: tax,
        }),
      );
    }
  });

  payments.forEach((payment) => {
    const reference = payment.paymentId || payment.id;
    const description = `${payment.customer || "Customer"} - ${payment.invoiceNumber || "invoice"}`;
    const cashAccount =
      payment.method === "cash" ? "Cash" : "Bank / Payment Account";

    entries.push(
      journalLine({
        id: `payment-${payment.id}-cash`,
        date: payment.date,
        account: cashAccount,
        type: "Asset",
        reference,
        description,
        debit: number(payment.amount),
      }),
      journalLine({
        id: `payment-${payment.id}-receivable`,
        date: payment.date,
        account: "Accounts Receivable",
        type: "Asset",
        reference,
        description,
        credit: number(payment.amount),
      }),
    );
  });

  expenses.forEach((expense) => {
    const reference = expense.expenseId || expense.id;
    const amount = number(expense.amount);
    entries.push(
      journalLine({
        id: `expense-${expense.id}-expense`,
        date: expense.date,
        account: `${expense.category || "General"} Expense`,
        type: "Expense",
        reference,
        description: expense.vendor || expense.note || "Business expense",
        debit: amount,
      }),
      journalLine({
        id: `expense-${expense.id}-cash`,
        date: expense.date,
        account: "Bank / Cash",
        type: "Asset",
        reference,
        description: expense.vendor || expense.note || "Business expense",
        credit: amount,
      }),
    );
  });

  purchases.filter(isPosted).forEach((purchase) => {
    const reference = purchase.number || purchase.id;
    const amount = number(purchase.amount);
    const subtotal =
      number(purchase.subtotal) || Math.max(0, amount - number(purchase.tax));
    const tax = number(purchase.tax);
    const description = purchase.supplier || "Supplier purchase";

    entries.push(
      journalLine({
        id: `purchase-${purchase.id}-purchase`,
        date: purchase.date,
        account: "Purchases",
        type: "Expense",
        reference,
        description,
        debit: subtotal,
      }),
      journalLine({
        id: `purchase-${purchase.id}-payable`,
        date: purchase.date,
        account: "Accounts Payable",
        type: "Liability",
        reference,
        description,
        credit: amount,
      }),
    );
    if (tax) {
      entries.push(
        journalLine({
          id: `purchase-${purchase.id}-tax`,
          date: purchase.date,
          account: "Input GST Credit",
          type: "Asset",
          reference,
          description: "GST paid on purchase",
          debit: tax,
        }),
      );
    }

    (purchase.payments || []).forEach((payment, index) => {
      const paymentReference =
        payment.reference || `${reference}-PAY-${index + 1}`;
      const cashAccount =
        payment.method === "cash" ? "Cash" : "Bank / Payment Account";
      entries.push(
        journalLine({
          id: `purchase-${purchase.id}-payment-${index}-payable`,
          date: payment.date,
          account: "Accounts Payable",
          type: "Liability",
          reference: paymentReference,
          description,
          debit: number(payment.amount),
        }),
        journalLine({
          id: `purchase-${purchase.id}-payment-${index}-cash`,
          date: payment.date,
          account: cashAccount,
          type: "Asset",
          reference: paymentReference,
          description,
          credit: number(payment.amount),
        }),
      );
    });
  });

  return entries.sort(
    (first, second) => new Date(second.date) - new Date(first.date),
  );
}

function AccountingPage() {
  const { rows: invoices, loading: loadingInvoices } = useApiList(
    "/invoices",
    [],
  );
  const { rows: payments, loading: loadingPayments } = useApiList(
    "/payments",
    [],
  );
  const { rows: expenses, loading: loadingExpenses } = useApiList(
    "/expenses",
    [],
  );
  const { rows: purchases, loading: loadingPurchases } = useApiList(
    "/purchases",
    [],
  );
  const [period, setPeriod] = useState("all");
  const [accountType, setAccountType] = useState("all");
  const [query, setQuery] = useState("");

  const loading =
    loadingInvoices || loadingPayments || loadingExpenses || loadingPurchases;
  const bounds = useMemo(() => getPeriodBounds(period), [period]);
  const journal = useMemo(
    () => buildJournal(invoices, payments, expenses, purchases),
    [invoices, payments, expenses, purchases],
  );
  const periodJournal = useMemo(
    () => journal.filter((entry) => inPeriod(entry.date, bounds)),
    [journal, bounds],
  );
  const filteredJournal = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return periodJournal.filter((entry) => {
      const matchesType = accountType === "all" || entry.type === accountType;
      const matchesQuery =
        !needle ||
        [entry.account, entry.reference, entry.description, entry.type].some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(needle),
        );
      return matchesType && matchesQuery;
    });
  }, [periodJournal, accountType, query]);

  const postedInvoices = invoices.filter(isPosted);
  const postedPurchases = purchases.filter(isPosted);
  const receivables = postedInvoices.reduce(
    (total, invoice) =>
      total + Math.max(0, number(invoice.amount) - number(invoice.paidAmount)),
    0,
  );
  const payables = postedPurchases.reduce(
    (total, purchase) =>
      total +
      Math.max(0, number(purchase.amount) - number(purchase.paidAmount)),
    0,
  );
  const periodRevenue = postedInvoices
    .filter((invoice) => inPeriod(invoice.date, bounds))
    .reduce(
      (total, invoice) =>
        total +
        (number(invoice.subtotal) ||
          Math.max(0, number(invoice.amount) - number(invoice.tax))),
      0,
    );
  const periodExpenses =
    expenses
      .filter((expense) => inPeriod(expense.date, bounds))
      .reduce((total, expense) => total + number(expense.amount), 0) +
    postedPurchases
      .filter((purchase) => inPeriod(purchase.date, bounds))
      .reduce(
        (total, purchase) =>
          total +
          (number(purchase.subtotal) ||
            Math.max(0, number(purchase.amount) - number(purchase.tax))),
        0,
      );
  const netProfit = periodRevenue - periodExpenses;
  const customerReceipts = payments
    .filter((payment) => inPeriod(payment.date, bounds))
    .reduce((total, payment) => total + number(payment.amount), 0);
  const supplierPayments = postedPurchases.reduce(
    (total, purchase) =>
      total +
      (purchase.payments || [])
        .filter((payment) => inPeriod(payment.date, bounds))
        .reduce((sum, payment) => sum + number(payment.amount), 0),
    0,
  );
  const directExpensePayments = expenses
    .filter((expense) => inPeriod(expense.date, bounds))
    .reduce((total, expense) => total + number(expense.amount), 0);
  const netCashMovement =
    customerReceipts - supplierPayments - directExpensePayments;
  const totalDebit = filteredJournal.reduce(
    (total, entry) => total + entry.debit,
    0,
  );
  const totalCredit = filteredJournal.reduce(
    (total, entry) => total + entry.credit,
    0,
  );

  const exportLedger = () =>
    downloadCsv(
      `general-ledger-${period}.csv`,
      filteredJournal.map(({ id, ...entry }) => entry),
    );

  if (loading) {
    return (
      <>
        <PageHeaderSkeleton />
        <StatCardsSkeleton />
        <Card className="overflow-hidden">
          <div className="flex justify-between border-b border-border p-5">
            <div className="space-y-2">
              <div className="h-5 w-36 animate-pulse rounded bg-muted" />
              <div className="h-3 w-52 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-9 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-7 gap-4 border-b border-border pb-3"
              >
                {Array.from({ length: 7 }).map((__, cell) => (
                  <div
                    key={cell}
                    className="h-4 animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Accounting"
        subtitle="Live ledger generated from sales, purchases, payments and expenses"
        actions={
          <>
            <Select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              {Object.entries(periodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              onClick={exportLedger}
              disabled={!filteredJournal.length}
            >
              <Download className="h-4 w-4" />
              Export ledger
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Receivables"
          value={formatINR(receivables)}
          icon={<Landmark className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Payables"
          value={formatINR(payables)}
          icon={<Wallet className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label={`Net profit - ${periodLabels[period]}`}
          value={formatINR(netProfit)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone={netProfit >= 0 ? "success" : "warning"}
        />
        <StatCard
          label="Net cash movement"
          value={formatINR(netCashMovement)}
          icon={<ArrowDownUp className="h-5 w-5" />}
          tone={netCashMovement >= 0 ? "info" : "warning"}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">General ledger</h3>
              {!loading && (
                <Badge tone="neutral">{periodJournal.length} entries</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Double-entry journals for {periodLabels[period].toLowerCase()}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              className="sm:w-64"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search account or reference"
            />
            <Select
              value={accountType}
              onChange={(event) => setAccountType(event.target.value)}
            >
              <option value="all">All account types</option>
              <option value="Asset">Assets</option>
              <option value="Liability">Liabilities</option>
              <option value="Income">Income</option>
              <option value="Expense">Expenses</option>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-5 py-2.5 font-medium">Account</th>
                <th className="px-5 py-2.5 font-medium">Type</th>
                <th className="px-5 py-2.5 font-medium">Reference</th>
                <th className="px-5 py-2.5 font-medium">Description</th>
                <th className="px-5 py-2.5 text-right font-medium">Debit</th>
                <th className="px-5 py-2.5 text-right font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {filteredJournal.length ? (
                filteredJournal.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-t border-border hover:bg-muted/25"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 font-medium">{entry.account}</td>
                    <td className="px-5 py-3">
                      <Badge
                        tone={
                          entry.type === "Income"
                            ? "success"
                            : entry.type === "Expense"
                              ? "warning"
                              : entry.type === "Liability"
                                ? "info"
                                : "primary"
                        }
                      >
                        {entry.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {entry.reference}
                    </td>
                    <td className="max-w-64 truncate px-5 py-3 text-muted-foreground">
                      {entry.description}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {entry.debit ? formatINR(entry.debit) : "-"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {entry.credit ? formatINR(entry.credit) : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-muted-foreground"
                  >
                    No ledger entries match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/30 font-semibold">
                <td className="px-5 py-3" colSpan={5}>
                  <span className="inline-flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Filtered totals
                  </span>
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {formatINR(totalDebit)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {formatINR(totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </>
  );
}

export default AccountingPage;
