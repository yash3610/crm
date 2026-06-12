import { useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
  Modal,
  Field,
  Input,
  Select,
} from "@/components/common/Primitives";
import { Building2, MapPin, Phone, Plus, Users } from "lucide-react";
import { formatINR } from "@/data/mock";
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
const seed = [
  {
    id: "B1",
    name: "HQ Mumbai",
    address: "Andheri East, Mumbai 400069",
    phone: "+91 22 4000 1100",
    team: 14,
    revenue: 1820000,
    status: "active",
  },
  {
    id: "B2",
    name: "Delhi",
    address: "Connaught Place, New Delhi 110001",
    phone: "+91 11 4500 2200",
    team: 8,
    revenue: 942000,
    status: "active",
  },
  {
    id: "B3",
    name: "Bengaluru",
    address: "Indiranagar, Bengaluru 560038",
    phone: "+91 80 4112 3300",
    team: 11,
    revenue: 1240000,
    status: "active",
  },
  {
    id: "B4",
    name: "Pune",
    address: "Baner, Pune 411045",
    phone: "+91 20 4612 8800",
    team: 6,
    revenue: 484000,
    status: "inactive",
  },
];
function BranchesPage() {
  const { rows, create } = useApiList("/branches", seed);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    address: "",
    phone: "",
    team: 0,
    revenue: 0,
    status: "active",
  });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Branch name is required");
    try {
      await create({
        ...f,
        team: Number(f.team),
        revenue: Number(f.revenue),
      });
      toast.success(`Branch "${f.name}" added`);
      setOpen(false);
      setF({
        name: "",
        address: "",
        phone: "",
        team: 0,
        revenue: 0,
        status: "active",
      });
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <>
      <PageHeader
        title="Branches"
        subtitle="Multi-location operations and revenue"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add branch
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((b) => (
          <Card key={b.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.id}</div>
                </div>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5" /> {b.address || "—"}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {b.phone || "—"}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {b.team} team members
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-end justify-between">
              <div>
                <div className="text-xs text-muted-foreground">
                  Revenue (MTD)
                </div>
                <div className="text-lg font-semibold tabular-nums">
                  {formatINR(b.revenue)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success(`Managing ${b.name}`)}
              >
                Manage
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add branch"
        description="Set up a new business location"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Save branch</Button>
          </>
        }
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Field label="Branch name" required>
            <Input
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              placeholder="Hyderabad"
            />
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
          <div className="sm:col-span-2">
            <Field label="Address">
              <Input
                value={f.address}
                onChange={(e) => setF({ ...f, address: e.target.value })}
                placeholder="Banjara Hills, Hyderabad 500034"
              />
            </Field>
          </div>
          <Field label="Phone">
            <Input
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
              placeholder="+91 40 XXXX XXXX"
            />
          </Field>
          <Field label="Team size">
            <Input
              type="number"
              value={f.team}
              onChange={(e) => setF({ ...f, team: Number(e.target.value) })}
            />
          </Field>
          <Field label="Opening revenue (₹)">
            <Input
              type="number"
              value={f.revenue}
              onChange={(e) => setF({ ...f, revenue: Number(e.target.value) })}
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}

export default BranchesPage;
