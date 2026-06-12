import { PageHeader, Card, Button } from "@/components/common/Primitives";
import { StatCard } from "@/components/common/StatCard";
import { formatINR } from "@/data/mock";
import { BookOpen, Scale, TrendingUp, Download } from "lucide-react";
import { downloadCsv } from "@/lib/downloadCsv";
const ledger = [
  {
    date: "2026-06-06",
    account: "Sales",
    debit: 0,
    credit: 36500,
    ref: "INV-2026-1006",
  },
  {
    date: "2026-06-05",
    account: "Sales",
    debit: 0,
    credit: 8400,
    ref: "INV-2026-1005",
  },
  {
    date: "2026-06-03",
    account: "Bank · HDFC",
    debit: 21850,
    credit: 0,
    ref: "PM01",
  },
  {
    date: "2026-06-02",
    account: "Rent expense",
    debit: 85000,
    credit: 0,
    ref: "E01",
  },
  {
    date: "2026-06-02",
    account: "Utilities",
    debit: 12400,
    credit: 0,
    ref: "E02",
  },
  {
    date: "2026-05-31",
    account: "Salaries",
    debit: 540000,
    credit: 0,
    ref: "E03",
  },
  {
    date: "2026-05-28",
    account: "Sales",
    debit: 0,
    credit: 152000,
    ref: "INV-2026-1003",
  },
];
function AccountingPage() {
  return (
    <>
      <PageHeader
        title="Accounting"
        subtitle="General ledger, journals and trial balance"
        actions={
          <Button
            variant="outline"
            onClick={() => downloadCsv("general-ledger.csv", ledger)}
          >
            <Download className="h-4 w-4" /> Export ledger
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Assets"
          value={formatINR(4820000)}
          delta={2.1}
          icon={<Scale className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Liabilities"
          value={formatINR(1240000)}
          delta={-0.6}
          icon={<BookOpen className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Net profit (MTD)"
          value={formatINR(174000)}
          delta={8.7}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="info"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold">General ledger</h3>
            <p className="text-xs text-muted-foreground">
              Recent journal entries
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Period: June 2026
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground bg-muted/40">
              <tr>
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-5 py-2.5 font-medium">Account</th>
                <th className="px-5 py-2.5 font-medium">Reference</th>
                <th className="px-5 py-2.5 font-medium text-right">Debit</th>
                <th className="px-5 py-2.5 font-medium text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(r.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="px-5 py-3 font-medium">{r.account}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.ref}</td>
                  <td className="px-5 py-3 tabular-nums text-right">
                    {r.debit ? formatINR(r.debit) : "—"}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-right">
                    {r.credit ? formatINR(r.credit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/30 font-semibold">
                <td className="px-5 py-3" colSpan={3}>
                  Totals
                </td>
                <td className="px-5 py-3 tabular-nums text-right">
                  {formatINR(659250)}
                </td>
                <td className="px-5 py-3 tabular-nums text-right">
                  {formatINR(196900)}
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
