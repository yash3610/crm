import { useNavigate } from "react-router-dom";
import { Download, Eye, Plus } from "lucide-react";

import {
  Button,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/common/Primitives";
import { DataTable } from "@/components/common/DataTable";
import { formatINR } from "@/data/mock";
import { useApiList } from "@/hooks/useApiList";
import { downloadCsv } from "@/lib/downloadCsv";

const seed = [
  {
    id: "Q1",
    number: "QUO-2026-0421",
    customer: "Acme Traders",
    date: "2026-06-04",
    validTill: "2026-06-18",
    amount: 84200,
    status: "sent",
  },
];

function quotationBadge(status) {
  if (status === "accepted") return "paid";
  if (status === "expired") return "overdue";
  if (status === "sent") return "pending";
  return "draft";
}

function QuotationsPage() {
  const navigate = useNavigate();
  const {
    rows,
    allRows,
    loading,
    pagination,
    setPage,
    setPageSize,
    setSearch,
    setFilters,
  } = useApiList("/quotations", seed, { paginated: true });
  const columns = [
    {
      key: "number",
      header: "Quotation",
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/quotations/${row.id}`)}
          className="font-medium text-primary hover:underline"
        >
          {row.number}
        </button>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <span className="text-muted-foreground">{row.customer}</span>
      ),
    },
    {
      key: "date",
      header: "Issued",
      render: (row) =>
        new Date(row.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "validTill",
      header: "Valid till",
      render: (row) =>
        new Date(row.validTill).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right tabular-nums",
      render: (row) => formatINR(row.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={quotationBadge(row.status)} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/quotations/${row.id}`)}
        >
          <Eye className="h-4 w-4" /> View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Quotations"
        subtitle="Create, preview and share item-wise customer quotations"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv("quotations.csv", allRows)}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => navigate("/quotations/new")}>
              <Plus className="h-4 w-4" /> Create Quotation
            </Button>
          </>
        }
      />
      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={["number", "customer"]}
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        loading={loading}
        toolbar={
          <Select
            defaultValue="all"
            onChange={(event) => setFilters({ status: event.target.value })}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
          </Select>
        }
      />
    </>
  );
}

export default QuotationsPage;
