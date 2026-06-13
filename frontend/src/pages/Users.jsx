import { useState } from "react";
import { KeyRound, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/common/Primitives";
import { useAuth } from "@/context/AuthContext";
import { useApiList } from "@/hooks/useApiList";

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

function formatLastSeen(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function UsersPage() {
  const { user } = useAuth();
  const { rows, loading, create, update, remove } = useApiList("/users", []);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);

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
                {rows.filter((member) => member.role === role.name).length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{role.description}</p>
          </div>
        ))}
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={["name", "email", "role", "status"]}
        toolbar={
          loading ? (
            <span className="text-xs text-muted-foreground">
              Loading users...
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {rows.filter((member) => member.status === "active").length}{" "}
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

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && !saving && setDeleting(null)}
        title="Delete this user?"
        description={`${deleting?.name || "This user"} will permanently lose workspace access.`}
        confirmLabel="Delete user"
        loading={saving}
        onConfirm={deleteUser}
      />
    </>
  );
}

export default UsersPage;
