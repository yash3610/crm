import { useState } from "react";
import {
  PageHeader,
  Button,
  Badge,
  StatusBadge,
  Modal,
  Field,
  Input,
  Select,
} from "@/components/common/Primitives";
import { DataTable } from "@/components/common/DataTable";
import { Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
const seed = [
  {
    id: "U1",
    name: "Rahul Aggarwal",
    email: "admin@billpro.io",
    role: "Owner",
    branch: "HQ Mumbai",
    status: "active",
    lastSeen: "Just now",
  },
  {
    id: "U2",
    name: "Sneha Iyer",
    email: "sneha@billpro.io",
    role: "Admin",
    branch: "HQ Mumbai",
    status: "active",
    lastSeen: "10 min ago",
  },
  {
    id: "U3",
    name: "Arjun Mehta",
    email: "arjun@billpro.io",
    role: "Accountant",
    branch: "Delhi",
    status: "active",
    lastSeen: "2 h ago",
  },
  {
    id: "U4",
    name: "Priya Nair",
    email: "priya@billpro.io",
    role: "Sales",
    branch: "Bengaluru",
    status: "active",
    lastSeen: "Yesterday",
  },
  {
    id: "U5",
    name: "Vikram Singh",
    email: "vikram@billpro.io",
    role: "Sales",
    branch: "Pune",
    status: "inactive",
    lastSeen: "2 weeks ago",
  },
];
function UsersPage() {
  const { rows, create } = useApiList("/users", seed);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    email: "",
    role: "Sales",
    branch: "HQ Mumbai",
    status: "active",
  });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.email.trim())
      return toast.error("Name and email are required");
    try {
      await create({ ...f, lastSeen: new Date().toISOString() });
      toast.success(`Invite sent to ${f.email}`);
      setOpen(false);
      setF({
        name: "",
        email: "",
        role: "Sales",
        branch: "HQ Mumbai",
        status: "active",
      });
    } catch (error) {
      toast.error(error.message);
    }
  };
  const cols = [
    {
      key: "name",
      header: "Member",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent text-accent-foreground grid place-items-center text-xs font-semibold">
            {r.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-muted-foreground">{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (r) => (
        <Badge
          tone={
            r.role === "Owner"
              ? "primary"
              : r.role === "Admin"
                ? "info"
                : "neutral"
          }
        >
          {r.role}
        </Badge>
      ),
    },
    { key: "branch", header: "Branch", render: (r) => r.branch },
    {
      key: "lastSeen",
      header: "Last seen",
      render: (r) => (
        <span className="text-muted-foreground">{r.lastSeen}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];
  const roleCounts = (role) => rows.filter((r) => r.role === role).length;
  return (
    <>
      <PageHeader
        title="Users & Roles"
        subtitle="Team members, permissions and access control"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Invite member
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { role: "Owner", desc: "Full access to all modules and billing" },
          { role: "Admin", desc: "Manage data, settings, and team members" },
          { role: "Accountant", desc: "Books, invoices and reports" },
          { role: "Sales", desc: "Quotations, invoices and customers" },
        ].map((r) => (
          <div
            key={r.role}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{r.role}</span>
            </div>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
            <div className="mt-3 text-2xl font-semibold tabular-nums">
              {roleCounts(r.role)}
            </div>
          </div>
        ))}
      </div>
      <DataTable
        rows={rows}
        columns={cols}
        searchKeys={["name", "email", "branch"]}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite team member"
        description="Send an email invitation with a role"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Send invite</Button>
          </>
        }
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Field label="Full name" required>
            <Input
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              placeholder="Aarav Sharma"
            />
          </Field>
          <Field label="Work email" required>
            <Input
              type="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
              placeholder="aarav@billpro.io"
            />
          </Field>
          <Field label="Role">
            <Select
              value={f.role}
              onChange={(e) => setF({ ...f, role: e.target.value })}
            >
              {["Owner", "Admin", "Accountant", "Sales"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Branch">
            <Select
              value={f.branch}
              onChange={(e) => setF({ ...f, branch: e.target.value })}
            >
              {["HQ Mumbai", "Delhi", "Bengaluru", "Pune"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={f.status}
              onChange={(e) => setF({ ...f, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </form>
      </Modal>
    </>
  );
}

export default UsersPage;
