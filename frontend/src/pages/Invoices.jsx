import { Link, useNavigate } from "react-router-dom";
import {
  PageHeader,
  Button,
  StatusBadge,
  Select,
} from "@/components/common/Primitives";
import { DataTable } from "@/components/common/DataTable";
import { invoices, formatINR } from "@/data/mock";
import { Plus, Download, Eye } from "lucide-react";
import { useApiList } from "@/hooks/useApiList";
import { downloadCsv } from "@/lib/downloadCsv";
function InvoicesPage() {
  const navigate = useNavigate();
  const {
    rows: invoiceRows,
    allRows,
    loading,
    pagination,
    setPage,
    setPageSize,
    setSearch,
    setFilters,
  } = useApiList("/invoices", invoices, { paginated: true });
  const cols = [
    {
      key: "number",
      header: "Invoice",
      render: (r) => <span className="font-medium">{r.number}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      render: (r) => (
        <span className="text-muted-foreground">{r.customer}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (r) =>
        new Date(r.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
    },
    {
      key: "due",
      header: "Due",
      render: (r) =>
        new Date(r.dueDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right tabular-nums",
      render: (r) => formatINR(r.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "act",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/invoices/${r.id}`)}
        >
          <Eye className="h-3.5 w-3.5" /> View invoice
        </Button>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="All customer invoices in your workspace"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv("invoices.csv", allRows)}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Link to="/invoices/new">
              <Button>
                <Plus className="h-4 w-4" /> Create invoice
              </Button>
            </Link>
          </>
        }
      />
      <DataTable
        rows={invoiceRows}
        columns={cols}
        searchKeys={["number", "customer"]}
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        loading={loading}
        toolbar={
          <>
            <Select
              defaultValue="all"
              onChange={(event) => setFilters({ status: event.target.value })}
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Draft</option>
            </Select>
            <Select
              defaultValue="all"
              onChange={(event) => setFilters({ days: event.target.value })}
            >
              <option value="all">All dates</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </Select>
          </>
        }
      />
    </>
  );
}

export default InvoicesPage;
