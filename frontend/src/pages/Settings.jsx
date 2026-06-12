import { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
} from "@/components/common/Primitives";
import { Building, Receipt, Bell, CreditCard, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/downloadCsv";
const tabs = [
  { id: "company", label: "Company", icon: Building },
  { id: "tax", label: "Tax & GST", icon: Receipt },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
];
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
function SettingsPage() {
  const [tab, setTab] = useState("company");
  const [settings, setSettings] = useState({ company: {}, tax: {} });

  useEffect(() => {
    api
      .get("/settings")
      .then((data) =>
        setSettings({
          company: data.company || {},
          tax: data.tax || {},
        }),
      )
      .catch((error) => toast.error(error.message));
  }, []);

  const saveSection = async (section, event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api.put("/settings", { [section]: values });
      setSettings((current) => ({ ...current, [section]: values }));
      toast.success(
        `${section === "tax" ? "Tax settings" : "Company details"} saved`,
      );
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <>
      <PageHeader title="Settings" subtitle="Company, tax and preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <Card className="p-2 h-fit">
          <nav className="space-y-0.5">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </nav>
        </Card>

        <Card className="p-6">
          {tab === "company" && (
            <form
              key={JSON.stringify(settings.company)}
              onSubmit={(event) => saveSection("company", event)}
              className="space-y-5"
            >
              <h3 className="font-semibold">Company profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Legal name">
                  <Input
                    name="name"
                    defaultValue={settings.company.name || ""}
                  />
                </Field>
                <Field label="Display name">
                  <Input
                    name="displayName"
                    defaultValue={settings.company.displayName || ""}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    name="email"
                    type="email"
                    defaultValue={settings.company.email || ""}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    name="phone"
                    defaultValue={settings.company.phone || ""}
                  />
                </Field>
                <Field label="Address">
                  <Input
                    name="address"
                    defaultValue={settings.company.address || ""}
                  />
                </Field>
                <Field label="Country">
                  <Select
                    name="country"
                    defaultValue={settings.company.country || "IN"}
                  >
                    <option value="IN">India</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                  </Select>
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          )}
          {tab === "tax" && (
            <form
              key={JSON.stringify(settings.tax)}
              onSubmit={(event) => saveSection("tax", event)}
              className="space-y-5"
            >
              <h3 className="font-semibold">Tax & GST</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="GSTIN">
                  <Input name="gstin" defaultValue={settings.tax.gstin || ""} />
                </Field>
                <Field label="PAN">
                  <Input name="pan" defaultValue={settings.tax.pan || ""} />
                </Field>
                <Field label="Default GST rate">
                  <Select
                    name="defaultGstRate"
                    defaultValue={settings.tax.defaultGstRate || "18"}
                  >
                    <option>0</option>
                    <option>5</option>
                    <option>12</option>
                    <option>18</option>
                    <option>28</option>
                  </Select>
                </Field>
                <Field label="Place of supply">
                  <Input
                    name="placeOfSupply"
                    defaultValue={settings.tax.placeOfSupply || ""}
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          )}
          {tab === "billing" && <BillingTab />}
          {tab === "notifications" && (
            <div className="space-y-4">
              <h3 className="font-semibold">Notification preferences</h3>
              {[
                "Email me when invoice is paid",
                "Alert me on overdue invoices",
                "Daily summary digest",
                "Low-stock alerts",
                "New customer signups",
              ].map((l, i) => (
                <label
                  key={l}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <span className="text-sm">{l}</span>
                  <input
                    type="checkbox"
                    defaultChecked={i < 4}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                </label>
              ))}
            </div>
          )}
          {tab === "appearance" && (
            <div className="space-y-5">
              <h3 className="font-semibold">Appearance</h3>
              <p className="text-sm text-muted-foreground">
                Toggle dark mode from the top bar.
              </p>
              <Field label="Accent color">
                <Select defaultValue="blue">
                  <option value="blue">Indigo</option>
                  <option value="violet">Violet</option>
                  <option value="green">Emerald</option>
                  <option value="rose">Rose</option>
                </Select>
              </Field>
              <Field label="Density">
                <Select defaultValue="comfortable">
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </Select>
              </Field>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    tagline: "For getting started",
    features: [
      "1 user",
      "50 invoices / month",
      "Basic reports",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 999,
    tagline: "For growing teams",
    features: [
      "5 users",
      "Unlimited invoices",
      "GST returns",
      "Inventory & barcodes",
      "Priority email support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 2499,
    tagline: "Best for businesses",
    features: [
      "Unlimited users",
      "Multi-branch",
      "Advanced analytics",
      "API access",
      "24×7 phone support",
    ],
  },
];
const billingHistory = [
  {
    id: "B-2026-06",
    date: "Jun 1, 2026",
    plan: "Premium",
    amount: 2499,
    status: "paid",
  },
  {
    id: "B-2026-05",
    date: "May 1, 2026",
    plan: "Premium",
    amount: 2499,
    status: "paid",
  },
  {
    id: "B-2026-04",
    date: "Apr 1, 2026",
    plan: "Premium",
    amount: 2499,
    status: "paid",
  },
  {
    id: "B-2026-03",
    date: "Mar 1, 2026",
    plan: "Growth",
    amount: 999,
    status: "paid",
  },
];
function BillingTab() {
  const [current, setCurrent] = useState("premium");
  const [method, setMethod] = useState("card");
  const plan = PLANS.find((p) => p.id === current);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Subscription & billing</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your plan, payment method and invoices
        </p>
      </div>

      <div className="rounded-xl border border-border p-5 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-primary uppercase tracking-wide">
              Current plan · {plan.name}
            </div>
            <div className="text-2xl font-semibold mt-1">
              {plan.price === 0
                ? "Free"
                : `₹${plan.price.toLocaleString("en-IN")} / month`}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Renews July 1, 2026 · {plan.tagline}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Invoices used</div>
              <div className="text-sm font-semibold">218 / Unlimited</div>
            </div>
            <div className="h-12 w-px bg-border hidden sm:block" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Users</div>
              <div className="text-sm font-semibold">5 / Unlimited</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Choose a plan</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const active = p.id === current;
            return (
              <div
                key={p.id}
                className={cn(
                  "rounded-xl border p-5 transition-all",
                  active
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{p.name}</div>
                  {active && (
                    <span className="text-[10px] uppercase tracking-wide font-semibold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-2xl font-semibold">
                  {p.price === 0
                    ? "Free"
                    : `₹${p.price.toLocaleString("en-IN")}`}
                  <span className="text-sm font-normal text-muted-foreground">
                    {p.price > 0 && " / mo"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.tagline}
                </p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-4"
                  variant={active ? "outline" : "primary"}
                  disabled={active}
                  onClick={() => {
                    setCurrent(p.id);
                    toast.success(`Switched to ${p.name} plan`);
                  }}
                >
                  {active
                    ? "Current plan"
                    : p.price >
                        (PLANS.find((x) => x.id === current)?.price ?? 0)
                      ? "Upgrade"
                      : "Switch"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Payment method</h4>
        <div className="space-y-2">
          {[
            { id: "card", label: "Visa ending 4242", sub: "Expires 09/27" },
            { id: "upi", label: "UPI · rahul@hdfc", sub: "Primary UPI" },
            { id: "bank", label: "HDFC Bank ****8821", sub: "NEFT/IMPS" },
          ].map((m) => (
            <label
              key={m.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                method === m.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent",
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pm"
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                  className="h-4 w-4 text-primary"
                />
                <div>
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.sub}</div>
                </div>
              </div>
              {method === m.id && (
                <span className="text-xs text-primary font-medium">
                  Default
                </span>
              )}
            </label>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Payment gateway is not configured yet")}
          >
            + Add new method
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Billing history</h4>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Invoice</th>
                <th className="text-left px-4 py-2.5">Date</th>
                <th className="text-left px-4 py-2.5">Plan</th>
                <th className="text-right px-4 py-2.5">Amount</th>
                <th className="text-right px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{b.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.date}</td>
                  <td className="px-4 py-3">{b.plan}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    ₹{b.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center rounded-full bg-success/15 text-success border border-success/20 px-2 py-0.5 text-[11px] font-medium">
                      Paid
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        downloadCsv(`${b.id}-receipt.csv`, [
                          {
                            invoice: b.id,
                            date: b.date,
                            plan: b.plan,
                            amount: b.amount,
                            status: b.status,
                          },
                        ])
                      }
                    >
                      Receipt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
