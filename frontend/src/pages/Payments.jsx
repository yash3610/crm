import { PageHeader } from "@/components/common/Primitives";
import { DataTable } from "@/components/common/DataTable";
import { formatINR, payments } from "@/data/mock";
import { useApiList } from "@/hooks/useApiList";

function Payments() {
  const { rows } = useApiList("/payments", payments);
  const columns = [
    {
      key: "invoice",
      header: "Invoice",
      render: (row) => <span className="font-medium">{row.invoice}</span>,
    },
    { key: "customer", header: "Customer", render: (row) => row.customer },
    {
      key: "date",
      header: "Date",
      render: (row) =>
        new Date(row.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
    },
    {
      key: "method",
      header: "Method",
      render: (row) => (
        <span className="text-xs font-medium uppercase text-muted-foreground">
          {row.method}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right tabular-nums",
      render: (row) => formatINR(row.amount),
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Recorded receipts and collections"
      />
      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={["invoice", "customer"]}
      />
    </>
  );
}

export default Payments;
