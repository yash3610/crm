import { useEffect, useState } from "react";
import {
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Plus,
  Share2,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/common/Primitives";
import { useAuth } from "@/context/AuthContext";
import { useApiList } from "@/hooks/useApiList";
import { api } from "@/lib/api";

const roles = [
  {
    name: "Owner",
    description: "Full workspace, billing and team control",
    tone: "primary",
  },
  {
    name: "Admin",
    description: "Manage settings, users and business data",
    tone: "info",
  },
  {
    name: "Accountant",
    description: "Invoices, purchases, payments and reports",
    tone: "success",
  },
  {
    name: "Sales",
    description: "Customers, quotations and sales invoices",
    tone: "warning",
  },
  {
    name: "Viewer",
    description: "Read-only access to permitted workspace data",
    tone: "neutral",
  },
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "Sales",
  status: "active",
};

const emptyCa = {
  enabled: false,
  name: "",
  phone: "",
  email: "",
  frequency: "monthly",
  sendGstr1: true,
  sendGstr3b: true,
  sendSales: true,
};

function formatLastSeen(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function UsersPage() {
  const { user } = useAuth();
  const {
    rows,
    allRows,
    loading,
    create,
    update,
    remove,
    pagination,
    setPage,
    setPageSize,
    setSearch,
  } = useApiList("/users", [], { paginated: true });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ca, setCa] = useState(emptyCa);
  const [caForm, setCaForm] = useState(emptyCa);
  const [caModal, setCaModal] = useState(false);
  const [removeCaOpen, setRemoveCaOpen] = useState(false);
  const [caLoading, setCaLoading] = useState(true);

  useEffect(() => {
    api
      .get("/settings")
      .then((settings) => {
        const savedCa = { ...emptyCa, ...(settings.caSharing || {}) };
        setCa(savedCa);
        setCaForm(savedCa);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setCaLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      name: member.name,
      email: member.email,
      password: "",
      role: member.role,
      status: member.status,
    });
    setModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModal(false);
    setEditing(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (!editing && form.password.length < 8) {
      toast.error("Temporary password must be at least 8 characters");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
    };
    if (editing && !payload.password) delete payload.password;

    try {
      setSaving(true);
      if (editing) {
        await update(editing.id, payload);
        toast.success(`${payload.name} updated`);
      } else {
        await create(payload);
        toast.success(`${payload.name} added`);
      }
      setModal(false);
      setEditing(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!deleting) return;
    try {
      setSaving(true);
      await remove(deleting.id);
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const openCaModal = () => {
    setCaForm({ ...emptyCa, ...ca });
    setCaModal(true);
  };

  const saveCa = async (event) => {
    event.preventDefault();
    if (!caForm.name.trim() || (!caForm.phone.trim() && !caForm.email.trim())) {
      toast.error("CA name and phone or email are required");
      return;
    }

    const payload = {
      ...caForm,
      name: caForm.name.trim(),
      phone: caForm.phone.trim(),
      email: caForm.email.trim(),
    };
    try {
      setSaving(true);
      await api.put("/settings", { caSharing: payload });
      setCa(payload);
      setCaModal(false);
      toast.success("CA details updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeCa = async () => {
    try {
      setSaving(true);
      await api.put("/settings", { caSharing: emptyCa });
      setCa(emptyCa);
      setCaForm(emptyCa);
      setRemoveCaOpen(false);
      toast.success("CA removed");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const isCurrentUser = (member) =>
    member.id === user?.userId || member.mongoId === user?.id;
  const canManage = (member) =>
    !isCurrentUser(member) &&
    member.role !== "Owner" &&
    !(user?.role === "Admin" && member.role === "Owner");

  const columns = [
    {
      key: "name",
      header: "Member",
      render: (member) => (
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {member.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="font-medium">
              {member.name}
              {isCurrentUser(member) && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (You)
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{member.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (member) => (
        <Badge
          tone={
            roles.find((role) => role.name === member.role)?.tone || "neutral"
          }
        >
          {member.role}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (member) => <StatusBadge status={member.status} />,
    },
    {
      key: "lastSeen",
      header: "Last seen",
      render: (member) => (
        <span className="text-muted-foreground">
          {formatLastSeen(member.lastSeen)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (member) => (
        <div className="flex justify-end gap-2">
          {!(user?.role === "Admin" && member.role === "Owner") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEdit(member)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          {canManage(member) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(member)}
              aria-label={`Delete ${member.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users & Roles"
        subtitle="Manage team members, role assignments and workspace access"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add member
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {roles.map((role) => (
          <div
            key={role.name}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{role.name}</span>
              </div>
              <Badge tone={role.tone}>
                {allRows.filter((member) => member.role === role.name).length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{role.description}</p>
          </div>
        ))}
      </div>

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-info/15 text-info">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">External Chartered Accountant</h2>
                {ca.name && (
                  <Badge tone={ca.enabled ? "success" : "neutral"}>
                    {ca.enabled ? "Sharing active" : "Sharing paused"}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                CA is an external report-sharing contact, not a workspace login.
              </p>
            </div>
          </div>
          {!caLoading && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openCaModal}>
                {ca.name ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {ca.name ? "Manage CA" : "Add CA"}
              </Button>
              {ca.name && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setRemoveCaOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>

        {caLoading ? (
          <div className="mt-5 grid gap-4 rounded-xl bg-muted/40 p-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        ) : ca.name ? (
          <div className="mt-5 grid gap-4 rounded-xl bg-muted/40 p-4 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">CA name</div>
              <div className="mt-1 font-medium">{ca.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Contact</div>
              <div className="mt-1 space-y-1 text-sm">
                {ca.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {ca.phone}
                  </div>
                )}
                {ca.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {ca.email}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Reports</div>
              <div className="mt-1 text-sm font-medium">
                {[
                  ca.sendGstr1 && "GSTR-1",
                  ca.sendGstr3b && "GSTR-3B",
                  ca.sendSales && "Sales summary",
                ]
                  .filter(Boolean)
                  .join(", ") || "None selected"}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            No Chartered Accountant is connected yet.
          </div>
        )}
      </Card>

      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={["name", "email", "role", "status"]}
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        loading={loading}
        toolbar={
          loading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span className="text-xs text-muted-foreground">
              {allRows.filter((member) => member.status === "active").length}{" "}
              active
            </span>
          )
        }
      />

      <Modal
        open={modal}
        onClose={closeModal}
        title={editing ? "Edit team member" : "Add team member"}
        description={
          editing
            ? "Update role, status or reset the password"
            : "Create a workspace login and assign its access"
        }
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Add member"}
            </Button>
          </>
        }
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Field label="Full name" required>
            <Input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </Field>
          <Field label="Work email" required>
            <Input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </Field>
          <Field label="Role">
            <Select
              className="w-full"
              value={form.role}
              disabled={
                editing?.role === "Owner" || (editing && isCurrentUser(editing))
              }
              onChange={(event) =>
                setForm({ ...form, role: event.target.value })
              }
            >
              {editing?.role === "Owner" && (
                <option value="Owner">Owner</option>
              )}
              {roles
                .filter((role) => role.name !== "Owner")
                .map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              className="w-full"
              value={form.status}
              disabled={
                editing?.role === "Owner" || (editing && isCurrentUser(editing))
              }
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <Field
            label={editing ? "New password" : "Temporary password"}
            required={!editing}
            hint={
              editing
                ? "Leave blank to keep the current password"
                : "Minimum 8 characters"
            }
          >
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                type="password"
                minLength={8}
                required={!editing}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
            </div>
          </Field>
        </form>
      </Modal>

      <Modal
        open={caModal}
        onClose={() => !saving && setCaModal(false)}
        title={
          ca.name ? "Manage Chartered Accountant" : "Add Chartered Accountant"
        }
        description="Manage the external contact used for scheduled report sharing"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setCaModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={saveCa} disabled={saving}>
              {saving ? "Saving..." : "Save CA"}
            </Button>
          </>
        }
      >
        <form onSubmit={saveCa} className="grid gap-4 sm:grid-cols-2">
          <Field label="CA name" required>
            <Input
              required
              value={caForm.name}
              onChange={(event) =>
                setCaForm({ ...caForm, name: event.target.value })
              }
            />
          </Field>
          <Field label="Sharing status">
            <Select
              className="w-full"
              value={caForm.enabled ? "active" : "paused"}
              onChange={(event) =>
                setCaForm({
                  ...caForm,
                  enabled: event.target.value === "active",
                })
              }
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </Select>
          </Field>
          <Field label="WhatsApp / phone">
            <Input
              value={caForm.phone}
              onChange={(event) =>
                setCaForm({ ...caForm, phone: event.target.value })
              }
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={caForm.email}
              onChange={(event) =>
                setCaForm({ ...caForm, email: event.target.value })
              }
            />
          </Field>
          <Field label="Sharing frequency">
            <Select
              className="w-full"
              value={caForm.frequency}
              onChange={(event) =>
                setCaForm({ ...caForm, frequency: event.target.value })
              }
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <div className="text-xs font-medium text-muted-foreground">
              Shared reports
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {[
                ["sendGstr1", "GSTR-1"],
                ["sendGstr3b", "GSTR-3B"],
                ["sendSales", "Sales summary"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={caForm[key]}
                    onChange={(event) =>
                      setCaForm({ ...caForm, [key]: event.target.checked })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && !saving && setDeleting(null)}
        title="Delete this user?"
        description={`${deleting?.name || "This user"} will permanently lose workspace access.`}
        confirmLabel="Delete user"
        loading={saving}
        onConfirm={deleteUser}
      />

      <ConfirmDialog
        open={removeCaOpen}
        onOpenChange={(open) => !open && !saving && setRemoveCaOpen(false)}
        title="Remove this CA?"
        description={`${ca.name || "This CA"} will be removed from report sharing. No workspace user account will be affected.`}
        confirmLabel="Remove CA"
        loading={saving}
        onConfirm={removeCa}
      />
    </>
  );
}

export default UsersPage;
