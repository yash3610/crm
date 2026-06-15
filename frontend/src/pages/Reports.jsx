import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Button,
  Card,
  PageHeader,
  Select,
} from "@/components/common/Primitives";
import { formatINR } from "@/data/mock";
import { useApiList } from "@/hooks/useApiList";
import { downloadCsv } from "@/lib/downloadCsv";
import { printDocument } from "@/lib/printDocument";

const ranges = {
  30: "Last 30 days",
  90: "Last 90 days",
  365: "Last 12 months",
  all: "All time",
};

function toAmount(item) {
  return Number(item.amount ?? item.total ?? item.grandTotal ?? 0) || 0;
}

function itemDate(item) {
  const value = item.date || item.createdAt;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function isPostedInvoice(invoice) {
  return !["draft", "cancelled"].includes(invoice.status);
}

function Reports() {
  const [range, setRange] = useState("365");
  const { rows: invoices, loading: invoicesLoading } = useApiList("/invoices");
  const { rows: payments, loading: paymentsLoading } = useApiList("/payments");
  const { rows: expenses, loading: expensesLoading } = useApiList("/expenses");
  const { rows: purchases, loading: purchasesLoading } =
    useApiList("/purchases");

  const loading =
    invoicesLoading || paymentsLoading || expensesLoading || purchasesLoading;

  const report = useMemo(() => {
    const cutoff =
      range === "all"
        ? null
        : new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000);
    const withinRange = (item) => {
      const date = itemDate(item);
      return date && (!cutoff || date >= cutoff);
    };

    const filteredInvoices = invoices.filter(
      (item) => withinRange(item) && isPostedInvoice(item),
    );
    const filteredPayments = payments.filter(withinRange);
    const filteredExpenses = expenses.filter(withinRange);
    const filteredPurchases = purchases.filter(withinRange);

    const sales = filteredInvoices.reduce(
      (sum, item) => sum + toAmount(item),
      0,
    );
    const collected = filteredPayments.reduce(
      (sum, item) => sum + toAmount(item),
      0,
    );
    const operatingExpenses = filteredExpenses.reduce(
      (sum, item) => sum + toAmount(item),
      0,
    );
    const purchaseTotal = filteredPurchases.reduce(
      (sum, item) => sum + toAmount(item),
      0,
    );
    const tax = filteredInvoices.reduce(
      (sum, item) => sum + (Number(item.tax) || 0),
      0,
    );

    const monthly = new Map();
    const addMonthly = (item, field) => {
      const date = itemDate(item);
      if (!date) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = monthly.get(key) || {
        key,
        month: date.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        sales: 0,
        expenses: 0,
        purchases: 0,
      };
      current[field] += toAmount(item);
      monthly.set(key, current);
    };
    filteredInvoices.forEach((item) => addMonthly(item, "sales"));
    filteredExpenses.forEach((item) => addMonthly(item, "expenses"));
    filteredPurchases.forEach((item) => addMonthly(item, "purchases"));

    const expenseCategories = new Map();
    filteredExpenses.forEach((item) => {
      const category = item.category || "Other";
      expenseCategories.set(
        category,
        (expenseCategories.get(category) || 0) + toAmount(item),
      );
    });

    const customers = new Map();
    filteredInvoices.forEach((item) => {
      const customer = item.customer || item.customerName || "Unknown";
      const current = customers.get(customer) || {
        customer,
        invoices: 0,
        sales: 0,
      };
      current.invoices += 1;
      current.sales += toAmount(item);
      customers.set(customer, current);
    });

    return {
      sales,
      collected,
      operatingExpenses,
      purchaseTotal,
      tax,
      profit: sales - operatingExpenses - purchaseTotal,
      outstanding: Math.max(0, sales - collected),
      invoiceCount: filteredInvoices.length,
      monthly: [...monthly.values()].sort((a, b) => a.key.localeCompare(b.key)),
      categories: [...expenseCategories.entries()]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      customers: [...customers.values()]
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 8),
    };
  }, [expenses, invoices, payments, purchases, range]);

  const exportReport = () => {
    downloadCsv(
      `business-report-${range}.csv`,
      report.monthly.map((item) => ({
        month: item.month,
        sales: item.sales,
        expenses: item.expenses,
        purchases: item.purchases,
        profit: item.sales - item.expenses - item.purchases,
      })),
    );
  };

  const metrics = [
    ["Total sales", report.sales],
    ["Payments collected", report.collected],
    ["Operating expenses", report.operatingExpenses],
    ["Purchases", report.purchaseTotal],
    ["Net profit", report.profit],
    ["Outstanding", report.outstanding],
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Live sales, collections, expenses and profitability"
        actions={
          <>
            <Select
              value={range}
              onChange={(event) => setRange(event.target.value)}
            >
              {Object.entries(ranges).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={exportReport}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => printDocument("business-report")}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
          </>
        }
      />

      <section id="business-report" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map(([label, value]) => (
            <Card key={label} className="p-5">
              <div className="text-sm text-muted-foreground">{label}</div>
              <div
                className={`mt-2 text-2xl font-semibold tabular-nums ${
                  label === "Net profit" && value < 0 ? "text-destructive" : ""
                }`}
              >
                {loading ? "Loading..." : formatINR(value)}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">Monthly performance</h3>
              <p className="text-sm text-muted-foreground">
                Sales compared with operating expenses and purchases
              </p>
            </div>
            <div className="text-right text-sm">
              <div className="text-muted-foreground">Invoices</div>
              <div className="font-semibold">{report.invoiceCount}</div>
            </div>
          </div>
          <div className="h-80">
            {report.monthly.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip formatter={(value) => formatINR(value)} />
                  <Legend />
                  <Bar
                    dataKey="sales"
                    name="Sales"
                    fill="#4f46e5"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="purchases"
                    name="Purchases"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {loading ? "Loading report..." : "No data for this period"}
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-semibold">Top customers</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Customers ranked by invoiced sales
            </p>
            <div className="space-y-3">
              {report.customers.map((item) => (
                <div
                  key={item.customer}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                >
                  <div>
                    <div className="font-medium">{item.customer}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.invoices} invoice{item.invoices === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="font-medium tabular-nums">
                    {formatINR(item.sales)}
                  </div>
                </div>
              ))}
              {!loading && !report.customers.length && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No customer sales found
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Expense breakdown</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Operating expenses grouped by category
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Invoice GST</div>
                <div className="font-semibold tabular-nums">
                  {formatINR(report.tax)}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {report.categories.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                >
                  <span className="font-medium">{item.category}</span>
                  <span className="tabular-nums">{formatINR(item.amount)}</span>
                </div>
              ))}
              {!loading && !report.categories.length && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No expenses found
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

export default Reports;
