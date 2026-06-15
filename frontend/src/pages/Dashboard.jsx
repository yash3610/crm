import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  Select,
  StatusBadge,
} from "@/components/common/Primitives";
import { StatCard } from "@/components/common/StatCard";
import {
  Wallet,
  Receipt,
  Users,
  AlertTriangle,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  invoices,
  products,
  categoryMix,
  notifications,
  formatINR,
} from "@/data/mock";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/common/LoadingSkeletons";
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const TREND_RANGES = {
  "1m": "1 Month",
  "3m": "3 Months",
  "6m": "6 Months",
  "1y": "1 Year",
  overall: "Overall",
};
function Dashboard() {
  const [dashboard, setDashboard] = useState({
    summary: {
      revenue: 2118000,
      outstanding: 257850,
      activeCustomers: 148,
      lowStockItems: products.filter((product) => product.stock <= 10).length,
    },
    revenueExpenseTrend: [],
    recentInvoices: invoices.slice(0, 5),
    notifications,
  });
  const [loading, setLoading] = useState(true);
  const [trendRange, setTrendRange] = useState("6m");
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setTrendLoading(true);
    api
      .get(`/dashboard?range=${trendRange}`)
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((error) => {
        if (active) toast.error(error.message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setTrendLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [trendRange]);

  if (loading) return <DashboardSkeleton />;

  const recent = dashboard.recentInvoices;
  const revenueExpenseTrend = dashboard.revenueExpenseTrend || [];
  return (
    <>
      <PageHeader
        title="Good morning, Rahul"
        subtitle="Here's how your business is doing today."
        actions={
          <>
            <Link to="/reports">
              <Button variant="outline">View reports</Button>
            </Link>
            <Link to="/invoices/new">
              <Button>
                <Plus className="h-4 w-4" /> New invoice
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total revenue"
          value={formatINR(dashboard.summary.revenue)}
          delta={12.4}
          icon={<Wallet className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Outstanding"
          value={formatINR(dashboard.summary.outstanding)}
          delta={-3.2}
          icon={<Receipt className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Active customers"
          value={String(dashboard.summary.activeCustomers)}
          delta={6.1}
          icon={<Users className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Low stock items"
          value={String(dashboard.summary.lowStockItems)}
          delta={0}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold">Revenue vs expenses</h3>
              <p className="text-xs text-muted-foreground">
                {TREND_RANGES[trendRange]}
                {trendLoading ? " - Updating..." : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                in INR
              </span>
              <Select
                value={trendRange}
                onChange={(event) => setTrendRange(event.target.value)}
                aria-label="Revenue and expenses period"
                className="h-8 text-xs"
                disabled={trendLoading}
              >
                {Object.entries(TREND_RANGES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart
                data={revenueExpenseTrend}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-4)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-4)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  formatter={(value, name) => [formatINR(value), name]}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#g1)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="var(--chart-4)"
                  strokeWidth={2.5}
                  fill="url(#g2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-1">Category mix</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Sales share by category
          </p>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryMix}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {categoryMix.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent invoices</h3>
            <Link
              to="/invoices"
              className="text-xs font-medium text-primary inline-flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">Invoice</th>
                  <th className="py-2 font-medium">Customer</th>
                  <th className="py-2 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="py-3 font-medium">{i.number}</td>
                    <td className="py-3 text-muted-foreground">{i.customer}</td>
                    <td className="py-3 tabular-nums">{formatINR(i.amount)}</td>
                    <td className="py-3">
                      <StatusBadge status={i.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Notifications</h3>
          <ul className="space-y-3">
            {dashboard.notifications.map((n) => (
              <li key={n.id} className="flex gap-3">
                <div
                  className={`mt-1 h-2 w-2 rounded-full ${n.type === "success" ? "bg-success" : n.type === "warning" ? "bg-warning" : "bg-info"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.body}</div>
                </div>
                <div className="text-xs text-muted-foreground">{n.time}</div>
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-5 border-t border-border">
            <h4 className="text-sm font-semibold mb-3">
              Top expense categories
            </h4>
            <div className="h-40">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { c: "Salaries", v: 540 },
                    { c: "Rent", v: 85 },
                    { c: "Mktg", v: 64 },
                    { c: "Logist.", v: 22 },
                    { c: "Util.", v: 12 },
                  ]}
                >
                  <XAxis
                    dataKey="c"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="v"
                    fill="var(--chart-1)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export default Dashboard;
