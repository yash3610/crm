import { Download } from "lucide-react";
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
import { formatINR, salesTrend } from "@/data/mock";
import { downloadCsv } from "@/lib/downloadCsv";
import { printDocument } from "@/lib/printDocument";

function Reports() {
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Sales, tax and profitability"
        actions={
          <>
            <Select defaultValue="6m">
              <option value="1m">Last month</option>
              <option value="3m">Last quarter</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last year</option>
            </Select>
            <Button
              variant="outline"
              onClick={() => printDocument("sales-expenses-report")}
            >
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv("sales-expenses-report.csv", salesTrend)
              }
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
          </>
        }
      />

      <Card className="print-document p-5">
        <h3 className="mb-4 font-semibold">Sales vs expenses</h3>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={salesTrend}>
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
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                formatter={(value) => formatINR(value)}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="sales"
                fill="var(--chart-1)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                fill="var(--chart-4)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}

export default Reports;
