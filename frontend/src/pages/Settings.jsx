import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeIndianRupee,
  BellRing,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Mail,
  MessageCircle,
  Palette,
  Printer,
  Receipt,
  Save,
  Share2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Select,
  StatusBadge,
} from "@/components/common/Primitives";
import { InvoiceDocument } from "@/components/documents/InvoiceDocument";
import { useAuth } from "@/context/AuthContext";
import { useApiList } from "@/hooks/useApiList";
import { api, assetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "business", label: "Manage Business", icon: BriefcaseBusiness },
  { id: "invoice", label: "Invoice Settings", icon: Palette },
  { id: "print", label: "Print Settings", icon: Printer },
  { id: "users", label: "Manage Users", icon: Users },
  { id: "reminders", label: "Reminders", icon: BellRing },
  { id: "caSharing", label: "CA Reports Sharing", icon: Share2 },
  { id: "pricing", label: "Pricing", icon: BadgeIndianRupee },
  { id: "support", label: "Help & Support", icon: CircleHelp },
];

const defaults = {
  account: { name: "", phone: "", email: "" },
  business: {
    name: "",
    phone: "",
    email: "",
    address: "",
    state: "Maharashtra",
    city: "",
    pincode: "",
    businessType: "Retail",
    industry: "General",
    registrationType: "Proprietorship",
    gstRegistered: true,
    gstin: "",
    pan: "",
    website: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
    registrationDocument: "",
    gstCertificate: "",
    panCard: "",
    eInvoicing: false,
    tds: false,
    tcs: false,
  },
  invoice: {
    theme: "professional",
    accent: "#4f46e5",
    showBalance: true,
    showDescription: true,
    showPhone: true,
    showTime: false,
    showHsn: true,
    showDiscount: true,
    showLogo: true,
    showSignature: true,
    showPaymentDetails: true,
    terms: "Payment is due within 14 days.",
  },
  print: {
    mode: "a4",
    theme: "invoice",
    paperSize: "3",
    showBalance: true,
    showDescription: true,
    showTime: false,
    showTaxBreakup: true,
    showSignature: true,
  },
  reminders: {
    sendTransactionMessage: true,
    paymentAlerts: true,
    beforeDue: true,
    beforeDueDays: "3",
    onDueDate: true,
    afterDue: true,
    afterDueDays: "2",
    dailySummary: false,
  },
  caSharing: {
    enabled: false,
    name: "",
    phone: "",
    email: "",
    frequency: "monthly",
    sendGstr1: true,
    sendGstr3b: true,
    sendSales: true,
  },
  pricing: { plan: "premium", cycle: "yearly" },
};

const plans = [
  {
    id: "starter",
    name: "Starter",
    monthly: 0,
    yearly: 0,
    description: "For small businesses getting started",
    features: ["1 user", "50 invoices / month", "Basic reports"],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 999,
    yearly: 9990,
    description: "For growing teams with advanced operations",
    features: ["5 users", "Unlimited invoices", "GST reports", "Inventory"],
  },
  {
    id: "premium",
    name: "Premium",
    monthly: 2499,
    yearly: 24990,
    description: "Advanced control for established businesses",
    features: [
      "Unlimited users",
      "Advanced team controls",
      "Custom invoice themes",
      "CA sharing",
    ],
  },
];

const sampleItems = [
  { name: "Premium Widget", qty: 2, rate: 1499, tax: 18 },
  { name: "Industrial Gear", qty: 1, rate: 899, tax: 18 },
  { name: "Stretch Film Roll", qty: 3, rate: 320, tax: 12 },
];

const MAX_IMAGE_FILE_SIZE = 2 * 1024 * 1024;
const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1200;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not read the selected image"));
    image.src = source;
  });
}

async function prepareImage(file) {
  if (!file) return null;
  if (
    !["image/jpeg", "image/png"].includes(file.type) ||
    file.size > MAX_IMAGE_FILE_SIZE
  ) {
    toast.error("Choose a JPG or PNG image smaller than 2 MB");
    return null;
  }

  let source;
  try {
    source = URL.createObjectURL(file);
    const image = await loadImage(source);

    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Could not prepare the selected image")),
        "image/webp",
        0.82,
      );
    });
  } catch (error) {
    toast.error(error.message);
    return null;
  } finally {
    if (source) URL.revokeObjectURL(source);
  }
}

function SettingField({ label, hint, children, className }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-medium text-foreground">{label}</span>
      {hint && (
        <span className="ml-2 text-[11px] text-muted-foreground">{hint}</span>
      )}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/40"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function SectionHeader({ title, subtitle, onSave, saving, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex gap-2">
        {action}
        {onSave && (
          <Button onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        )}
      </div>
    </div>
  );
}

function InvoicePreview({
  business,
  invoice,
  printSettings = {},
  compact = false,
}) {
  return (
    <InvoiceDocument
      business={business}
      customer={{
        name: "Acme Traders",
        phone: "+91 98101 22334",
        email: "billing@acme.in",
        city: "Mumbai, Maharashtra",
        gstin: "27XYZAB1234C1Z2",
      }}
      invoice={{
        number: "INV-2026-1008",
        date: "2026-06-12",
        dueDate: "2026-06-26",
        lines: sampleItems,
      }}
      settings={invoice}
      printSettings={printSettings}
      compact={compact}
      className="shadow-sm"
    />
  );
}

function SettingsPage() {
  const { user } = useAuth();
  const { rows: users, create: createUser } = useApiList("/users", []);
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [loading, setLoading] = useState(true);
  const [userModal, setUserModal] = useState(false);
  const [caModal, setCaModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Sales",
    status: "active",
  });

  useEffect(() => {
    api
      .get("/settings")
      .then((data) => {
        setSettings((current) => {
          const merged = { ...current };
          Object.entries(data).forEach(([key, value]) => {
            merged[key] =
              value && typeof value === "object" && !Array.isArray(value)
                ? { ...(current[key] || {}), ...value }
                : value;
          });
          merged.account = {
            ...current.account,
            name: user?.name || "",
            email: user?.email || "",
            ...(data.account || {}),
          };
          merged.business = {
            ...current.business,
            ...(data.company || {}),
            ...(data.tax || {}),
            ...(data.business || {}),
          };
          if (merged.print && merged.print.theme !== "invoice") {
            merged.print.theme = "invoice";
          }
          merged.invoice.theme = "professional";
          return merged;
        });
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [user]);

  const section = settings[activeTab] || {};
  const update = (key, value) =>
    setSettings((current) => ({
      ...current,
      [activeTab]: { ...current[activeTab], [key]: value },
    }));
  const updateSection = (name, key, value) =>
    setSettings((current) => ({
      ...current,
      [name]: { ...current[name], [key]: value },
    }));

  const save = async (name = activeTab, override) => {
    try {
      setSaving(true);
      const value = override ?? settings[name];
      await api.put("/settings", { [name]: value });
      setSettings((current) => ({ ...current, [name]: value }));
      toast.success(
        `${tabs.find((item) => item.id === name)?.label || "Settings"} saved`,
      );
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const inviteUser = async (event) => {
    event.preventDefault();
    try {
      await createUser(userForm);
      toast.success(`User ${userForm.email} added`);
      setUserModal(false);
      setUserForm({
        name: "",
        email: "",
        password: "",
        role: "Sales",
        status: "active",
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const uploadBusinessImage = async (key, file) => {
    const image = await prepareImage(file);
    if (!image) return;

    await uploadBusinessFile(key, image);
  };

  const uploadBusinessDocument = async (key, file) => {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "application/pdf"].includes(file.type) ||
      file.size > MAX_DOCUMENT_FILE_SIZE
    ) {
      toast.error("Choose a JPG, PNG or PDF file smaller than 5 MB");
      return;
    }

    await uploadBusinessFile(key, file);
  };

  const uploadBusinessFile = async (key, file) => {
    const labels = {
      logo: "Logo",
      signature: "Signature",
      registrationDocument: "Registration document",
      gstCertificate: "GST certificate",
      panCard: "PAN card",
    };

    try {
      setUploading(key);
      const uploaded = await api.upload(
        `/settings/files/business/${key}`,
        file,
      );
      updateSection("business", key, uploaded.url);
      toast.success(`${labels[key]} uploaded`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading("");
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <>
      <div className="flex h-dvh overflow-hidden bg-background">
        <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
          <div className="shrink-0 border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {user?.name
                  ?.split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {user?.name}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {user?.tenant?.name}
                </div>
              </div>
            </div>
            <Link
              to="/"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="shrink-0 border-t border-border px-4 py-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              Tenant-secured workspace
            </div>
            <div className="mt-2">BillPro ERP Suite</div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
            <Link
              to="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="font-semibold">Settings</div>
              <div className="text-xs text-muted-foreground">
                {tabs.find((item) => item.id === activeTab)?.label}
              </div>
            </div>
          </header>

          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-card p-2 lg:hidden">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <main className="min-w-0 flex-1 overflow-y-auto bg-background">
            {activeTab === "account" && (
              <>
                <SectionHeader
                  title="Account settings"
                  subtitle="Your profile and subscription information"
                  onSave={() => save()}
                  saving={saving}
                />
                <div className="space-y-6 p-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <SettingField label="Full name">
                      <Input
                        value={section.name}
                        onChange={(e) => update("name", e.target.value)}
                      />
                    </SettingField>
                    <SettingField label="Mobile number">
                      <Input
                        value={section.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </SettingField>
                    <SettingField label="Email">
                      <Input
                        type="email"
                        value={section.email}
                        onChange={(e) => update("email", e.target.value)}
                      />
                    </SettingField>
                  </div>
                  <Card className="p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <Badge tone="primary">Current plan</Badge>
                        <h3 className="mt-2 text-xl font-semibold capitalize">
                          {settings.pricing.plan} plan
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Workspace: {user?.tenant?.name}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("pricing")}
                      >
                        Manage subscription
                      </Button>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {activeTab === "business" && (
              <>
                <SectionHeader
                  title="Business settings"
                  subtitle="Company, registration and tax details shown on invoices"
                  onSave={() => save()}
                  saving={saving}
                />
                <div className="space-y-6 p-5 sm:p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ["logo", "Business logo", Building2],
                      ["signature", "Authorized signature", Receipt],
                    ].map(([key, label, Icon]) => (
                      <label
                        key={key}
                        className="flex min-h-24 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="grid h-12 w-14 shrink-0 place-items-center rounded-lg bg-primary/10">
                          {section[key] ? (
                            <img
                              src={assetUrl(section[key])}
                              alt=""
                              className="h-10 w-12 object-contain"
                            />
                          ) : (
                            <Icon className="h-7 w-7 text-primary" />
                          )}
                        </div>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            {label}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {uploading === key
                              ? "Uploading..."
                              : "JPG or PNG, maximum 2 MB"}
                          </span>
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          disabled={Boolean(uploading)}
                          onChange={async (event) => {
                            await uploadBusinessImage(
                              key,
                              event.target.files?.[0],
                            );
                            event.target.value = "";
                          }}
                        />
                      </label>
                    ))}
                  </div>

                  <Card className="p-5 sm:p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold">Business documents</h3>
                      <p className="text-xs text-muted-foreground">
                        Files are stored securely for this workspace. Uploading
                        a replacement removes the previous file.
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        ["registrationDocument", "Registration document"],
                        ["gstCertificate", "GST certificate"],
                        ["panCard", "PAN card"],
                      ].map(([key, label]) => (
                        <div
                          key={key}
                          className="rounded-xl border border-dashed border-border transition-colors hover:border-primary/50 hover:bg-primary/5"
                        >
                          <label className="flex cursor-pointer items-start gap-3 p-4">
                            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">
                                {label}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {uploading === key
                                  ? "Uploading..."
                                  : section[key]
                                    ? "Uploaded - click to replace"
                                    : "JPG, PNG or PDF, maximum 5 MB"}
                              </span>
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,application/pdf"
                              className="hidden"
                              disabled={Boolean(uploading)}
                              onChange={async (event) => {
                                await uploadBusinessDocument(
                                  key,
                                  event.target.files?.[0],
                                );
                                event.target.value = "";
                              }}
                            />
                          </label>
                          {section[key] && uploading !== key && (
                            <a
                              href={assetUrl(section[key])}
                              target="_blank"
                              rel="noreferrer"
                              className="mx-4 mb-4 inline-block text-xs font-medium text-primary hover:underline"
                            >
                              View document
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="grid items-start gap-6 xl:grid-cols-2">
                    <Card className="p-5 sm:p-6">
                      <div className="mb-5">
                        <h3 className="font-semibold">Business information</h3>
                        <p className="text-xs text-muted-foreground">
                          Contact and address details used across documents
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <SettingField
                          label="Business name"
                          className="sm:col-span-2"
                        >
                          <Input
                            value={section.name}
                            onChange={(e) => update("name", e.target.value)}
                          />
                        </SettingField>
                        <SettingField label="Company phone">
                          <Input
                            value={section.phone}
                            onChange={(e) => update("phone", e.target.value)}
                          />
                        </SettingField>
                        <SettingField label="Company email">
                          <Input
                            type="email"
                            value={section.email}
                            onChange={(e) => update("email", e.target.value)}
                          />
                        </SettingField>
                        <SettingField
                          label="Billing address"
                          className="sm:col-span-2"
                        >
                          <Input
                            value={section.address}
                            onChange={(e) => update("address", e.target.value)}
                          />
                        </SettingField>
                        <SettingField label="State">
                          <Input
                            value={section.state}
                            onChange={(e) => update("state", e.target.value)}
                          />
                        </SettingField>
                        <SettingField label="City">
                          <Input
                            value={section.city}
                            onChange={(e) => update("city", e.target.value)}
                          />
                        </SettingField>
                        <SettingField label="Pincode">
                          <Input
                            value={section.pincode}
                            onChange={(e) => update("pincode", e.target.value)}
                          />
                        </SettingField>
                        <SettingField label="Website">
                          <Input
                            value={section.website}
                            onChange={(e) => update("website", e.target.value)}
                          />
                        </SettingField>
                      </div>
                    </Card>

                    <Card className="p-5 sm:p-6">
                      <div className="mb-5">
                        <h3 className="font-semibold">Registration & tax</h3>
                        <p className="text-xs text-muted-foreground">
                          Business classification and statutory preferences
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <SettingField label="Business type">
                          <Select
                            className="w-full"
                            value={section.businessType}
                            onChange={(e) =>
                              update("businessType", e.target.value)
                            }
                          >
                            <option>Retail</option>
                            <option>Wholesale</option>
                            <option>Service</option>
                            <option>Manufacturing</option>
                          </Select>
                        </SettingField>
                        <SettingField label="Industry type">
                          <Select
                            className="w-full"
                            value={section.industry}
                            onChange={(e) => update("industry", e.target.value)}
                          >
                            <option>General</option>
                            <option>Electronics</option>
                            <option>Textiles</option>
                            <option>Food & Beverage</option>
                            <option>Professional Services</option>
                          </Select>
                        </SettingField>
                        <SettingField
                          label="Registration type"
                          className="sm:col-span-2"
                        >
                          <Select
                            className="w-full"
                            value={section.registrationType}
                            onChange={(e) =>
                              update("registrationType", e.target.value)
                            }
                          >
                            <option>Proprietorship</option>
                            <option>Partnership</option>
                            <option>Private Limited Company</option>
                            <option>LLP</option>
                          </Select>
                        </SettingField>
                        <SettingField label="PAN number">
                          <Input
                            value={section.pan}
                            onChange={(e) =>
                              update("pan", e.target.value.toUpperCase())
                            }
                          />
                        </SettingField>
                        <SettingField label="GSTIN">
                          <Input
                            value={section.gstin}
                            onChange={(e) =>
                              update("gstin", e.target.value.toUpperCase())
                            }
                          />
                        </SettingField>
                      </div>
                      <div className="mt-5 space-y-3">
                        <Toggle
                          checked={section.gstRegistered}
                          onChange={(value) => update("gstRegistered", value)}
                          label="GST registered business"
                        />
                        <Toggle
                          checked={section.eInvoicing}
                          onChange={(value) => update("eInvoicing", value)}
                          label="Enable e-Invoicing"
                          description="Prepare invoices for government e-invoice integration"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Toggle
                            checked={section.tds}
                            onChange={(value) => update("tds", value)}
                            label="Enable TDS"
                          />
                          <Toggle
                            checked={section.tcs}
                            onChange={(value) => update("tcs", value)}
                            label="Enable TCS"
                          />
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-5 sm:p-6">
                    <div className="mb-5">
                      <h3 className="font-semibold">Payment details</h3>
                      <p className="text-xs text-muted-foreground">
                        Bank and UPI details shown on invoices when enabled
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      <SettingField label="Bank name">
                        <Input
                          value={section.bankName}
                          onChange={(e) => update("bankName", e.target.value)}
                        />
                      </SettingField>
                      <SettingField label="Account holder">
                        <Input
                          value={section.accountName}
                          onChange={(e) =>
                            update("accountName", e.target.value)
                          }
                        />
                      </SettingField>
                      <SettingField label="Account number">
                        <Input
                          value={section.accountNumber}
                          onChange={(e) =>
                            update("accountNumber", e.target.value)
                          }
                        />
                      </SettingField>
                      <SettingField label="IFSC code">
                        <Input
                          value={section.ifsc}
                          onChange={(e) =>
                            update("ifsc", e.target.value.toUpperCase())
                          }
                        />
                      </SettingField>
                      <SettingField label="UPI ID">
                        <Input
                          value={section.upiId}
                          onChange={(e) => update("upiId", e.target.value)}
                        />
                      </SettingField>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {activeTab === "invoice" && (
              <>
                <SectionHeader
                  title="Invoice settings"
                  subtitle="Choose the invoice appearance and visible information"
                  onSave={() => save()}
                  saving={saving}
                />
                <div className="grid bg-muted/20 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="max-h-[760px] overflow-auto p-6">
                    <InvoicePreview
                      business={settings.business}
                      invoice={section}
                    />
                  </div>
                  <div className="space-y-5 border-t border-border bg-card p-5 xl:border-l xl:border-t-0">
                    <div>
                      <h3 className="font-semibold">Invoice layout</h3>
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary bg-primary/5 p-3 text-primary">
                        <FileText className="h-7 w-7 shrink-0" />
                        <div>
                          <div className="text-sm font-semibold">
                            Professional
                          </div>
                          <div className="text-xs opacity-80">
                            Logo, billing details, payment box, tax summary and
                            signature
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">Accent color</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          "#111827",
                          "#4f46e5",
                          "#0f766e",
                          "#b91c1c",
                          "#c0841a",
                          "#7e22ce",
                        ].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => update("accent", color)}
                            className="grid h-9 w-9 place-items-center rounded-lg"
                            style={{ backgroundColor: color }}
                          >
                            {section.accent === color && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    {[
                      ["showBalance", "Show party balance"],
                      ["showDescription", "Show item description"],
                      ["showPhone", "Show phone number"],
                      ["showTime", "Show invoice time"],
                      ["showHsn", "Show HSN/SAC column"],
                      ["showDiscount", "Show discount column"],
                      ["showLogo", "Show business logo"],
                      ["showSignature", "Show authorized signature"],
                      ["showPaymentDetails", "Show bank/payment details"],
                    ].map(([key, label]) => (
                      <Toggle
                        key={key}
                        checked={section[key]}
                        onChange={(value) => update(key, value)}
                        label={label}
                      />
                    ))}
                    <SettingField label="Terms & conditions">
                      <textarea
                        className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        value={section.terms}
                        onChange={(e) => update("terms", e.target.value)}
                      />
                    </SettingField>
                  </div>
                </div>
              </>
            )}

            {activeTab === "print" && (
              <>
                <SectionHeader
                  title="Print settings"
                  subtitle="Configure A4 and thermal invoice printing"
                  onSave={() => save()}
                  saving={saving}
                />
                <div className="grid bg-muted/20 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="max-h-[760px] overflow-auto p-6">
                    <InvoicePreview
                      business={settings.business}
                      invoice={{
                        ...settings.invoice,
                        theme: "professional",
                        showBalance: section.showBalance,
                        showDescription: section.showDescription,
                        showTime: section.showTime,
                      }}
                      printSettings={section}
                      compact={section.mode === "thermal"}
                    />
                  </div>
                  <div className="space-y-4 border-t border-border bg-card p-5 xl:border-l xl:border-t-0">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["a4", "A4 Invoice"],
                        ["thermal", "Thermal"],
                      ].map(([value, label]) => (
                        <Button
                          key={value}
                          variant={
                            section.mode === value ? "primary" : "outline"
                          }
                          onClick={() => update("mode", value)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                      Print uses the Professional invoice layout.
                    </div>
                    {section.mode === "thermal" && (
                      <SettingField label="Paper size">
                        <Select
                          value={section.paperSize}
                          onChange={(e) => update("paperSize", e.target.value)}
                        >
                          <option value="2">2 inch</option>
                          <option value="3">3 inch</option>
                        </Select>
                      </SettingField>
                    )}
                    {[
                      ["showBalance", "Show party balance"],
                      ["showDescription", "Show item description"],
                      ["showTime", "Show time on invoices"],
                      ["showTaxBreakup", "Show tax breakup"],
                      ["showSignature", "Show signature area"],
                    ].map(([key, label]) => (
                      <Toggle
                        key={key}
                        checked={section[key]}
                        onChange={(value) => update(key, value)}
                        label={label}
                      />
                    ))}
                    <div className="rounded-xl border border-border p-4 text-sm">
                      <div className="font-medium">Logo & signature</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        These are managed in Business Settings and automatically
                        included in invoice and print previews.
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setActiveTab("business")}
                      >
                        Open business settings
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "users" && (
              <>
                <SectionHeader
                  title="Manage users"
                  subtitle="Team members, roles and workspace access"
                  action={
                    <Link
                      to="/users"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
                    >
                      <Users className="h-4 w-4" />
                      Users & roles
                    </Link>
                  }
                />
                <div className="space-y-5 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">
                        Number of users
                      </div>
                      <div className="mt-1 text-3xl font-semibold">
                        {users.length}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">
                        Active users
                      </div>
                      <div className="mt-1 text-3xl font-semibold">
                        {
                          users.filter((item) => item.status === "active")
                            .length
                        }
                      </div>
                    </Card>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Last seen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="px-4 py-3">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.email}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge tone="info">{item.role}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={item.status} />
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {item.lastSeen
                                ? new Date(item.lastSeen).toLocaleString(
                                    "en-IN",
                                  )
                                : "Never"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === "reminders" && (
              <>
                <SectionHeader
                  title="Reminder settings"
                  subtitle="Control payment and transaction reminders"
                  onSave={() => save()}
                  saving={saving}
                />
                <div className="space-y-4 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Toggle
                      checked={section.sendTransactionMessage}
                      onChange={(value) =>
                        update("sendTransactionMessage", value)
                      }
                      label="Send billing WhatsApp/SMS to party"
                      description="Notify customers after creating a transaction"
                    />
                    <Toggle
                      checked={section.paymentAlerts}
                      onChange={(value) => update("paymentAlerts", value)}
                      label="Get payment reminders on WhatsApp"
                      description="Alerts for outstanding customer payments"
                    />
                  </div>
                  <Card className="p-5">
                    <h3 className="font-semibold">To party</h3>
                    <p className="text-xs text-muted-foreground">
                      Reminders sent to customers
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <Toggle
                        checked={section.beforeDue}
                        onChange={(value) => update("beforeDue", value)}
                        label="Before due date"
                      />
                      <Toggle
                        checked={section.onDueDate}
                        onChange={(value) => update("onDueDate", value)}
                        label="On due date"
                      />
                      <Toggle
                        checked={section.afterDue}
                        onChange={(value) => update("afterDue", value)}
                        label="After due date"
                      />
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <SettingField label="Days before due">
                        <Input
                          type="number"
                          min="1"
                          value={section.beforeDueDays}
                          onChange={(e) =>
                            update("beforeDueDays", e.target.value)
                          }
                        />
                      </SettingField>
                      <SettingField label="Repeat every days after due">
                        <Input
                          type="number"
                          min="1"
                          value={section.afterDueDays}
                          onChange={(e) =>
                            update("afterDueDays", e.target.value)
                          }
                        />
                      </SettingField>
                    </div>
                  </Card>
                  <Toggle
                    checked={section.dailySummary}
                    onChange={(value) => update("dailySummary", value)}
                    label="Daily summary for you"
                    description="Receive a daily workspace activity and collection summary"
                  />
                </div>
              </>
            )}

            {activeTab === "caSharing" && (
              <>
                <SectionHeader
                  title="CA reports sharing"
                  subtitle="Automatically share tax and sales reports with your CA"
                  onSave={() => save()}
                  saving={saving}
                  action={
                    <Button variant="outline" onClick={() => setCaModal(true)}>
                      {section.name ? "Edit CA" : "Add your CA"}
                    </Button>
                  }
                />
                <div className="space-y-5 p-5">
                  <Toggle
                    checked={section.enabled}
                    onChange={(value) => update("enabled", value)}
                    label="Enable automatic report sharing"
                    description="Reports are shared on the first day of every month"
                  />
                  {section.name ? (
                    <Card className="p-5">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <div className="text-lg font-semibold">
                            {section.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {section.phone}{" "}
                            {section.email && `- ${section.email}`}
                          </div>
                        </div>
                        <Badge tone={section.enabled ? "success" : "neutral"}>
                          {section.enabled
                            ? "Sharing active"
                            : "Sharing paused"}
                        </Badge>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-10 text-center">
                      <Share2 className="mx-auto h-10 w-10 text-primary" />
                      <h3 className="mt-3 font-semibold">
                        Add your Chartered Accountant
                      </h3>
                      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                        Save your CA details once and manage monthly report
                        sharing without manual follow-up.
                      </p>
                      <Button className="mt-4" onClick={() => setCaModal(true)}>
                        Add CA details
                      </Button>
                    </Card>
                  )}
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      ["sendGstr1", "GSTR-1 report"],
                      ["sendGstr3b", "GSTR-3B report"],
                      ["sendSales", "Sales summary"],
                    ].map(([key, label]) => (
                      <Toggle
                        key={key}
                        checked={section[key]}
                        onChange={(value) => update(key, value)}
                        label={label}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "pricing" && (
              <>
                <SectionHeader
                  title="Pricing & subscription"
                  subtitle="Choose a plan based on your workspace needs"
                />
                <div className="space-y-5 p-5">
                  <div className="mx-auto flex w-fit rounded-lg border border-border p-1">
                    {["monthly", "yearly"].map((cycle) => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => update("cycle", cycle)}
                        className={cn(
                          "rounded-md px-6 py-2 text-sm font-medium capitalize",
                          section.cycle === cycle &&
                            "bg-primary text-primary-foreground",
                        )}
                      >
                        {cycle}
                        {cycle === "yearly" && (
                          <span className="ml-2 text-[10px]">Save 17%</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {plans.map((plan) => {
                      const current = section.plan === plan.id;
                      const price =
                        section.cycle === "yearly" ? plan.yearly : plan.monthly;
                      return (
                        <Card
                          key={plan.id}
                          className={cn(
                            "flex flex-col p-5",
                            current && "border-primary ring-2 ring-primary/15",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                              {plan.name}
                            </h3>
                            {current && <Badge tone="primary">Current</Badge>}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {plan.description}
                          </p>
                          <div className="mt-5 text-3xl font-semibold">
                            {price === 0
                              ? "Free"
                              : `INR ${price.toLocaleString("en-IN")}`}
                            {price > 0 && (
                              <span className="text-xs font-normal text-muted-foreground">
                                {" "}
                                /{" "}
                                {section.cycle === "yearly" ? "year" : "month"}
                              </span>
                            )}
                          </div>
                          <ul className="my-5 flex-1 space-y-2 text-sm">
                            {plan.features.map((feature) => (
                              <li key={feature} className="flex gap-2">
                                <Check className="mt-0.5 h-4 w-4 text-success" />{" "}
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button
                            variant={current ? "outline" : "primary"}
                            disabled={current || saving}
                            onClick={() => {
                              const next = { ...section, plan: plan.id };
                              update("plan", plan.id);
                              save("pricing", next);
                            }}
                          >
                            {current ? "Current plan" : "Choose plan"}
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {activeTab === "support" && (
              <>
                <SectionHeader
                  title="Help & support"
                  subtitle="Get assistance and find common answers"
                />
                <div className="space-y-5 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-5">
                      <MessageCircle className="h-7 w-7 text-primary" />
                      <h3 className="mt-3 font-semibold">Chat support</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Talk to the support team about your workspace.
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() =>
                          window.open(
                            "https://wa.me/?text=I need help with BillPro",
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        Start chat
                      </Button>
                    </Card>
                    <Card className="p-5">
                      <Mail className="h-7 w-7 text-info" />
                      <h3 className="mt-3 font-semibold">Email support</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Send detailed questions or screenshots by email.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          window.location.href =
                            "mailto:support@billpro.local?subject=BillPro support";
                        }}
                      >
                        Email support
                      </Button>
                    </Card>
                  </div>
                  <Card className="divide-y divide-border">
                    {[
                      [
                        "How is tenant data protected?",
                        "Every API request is authenticated and scoped to your workspace.",
                      ],
                      [
                        "How do invoice themes work?",
                        "Select a theme and options, preview them live, then save the section.",
                      ],
                      [
                        "Can I share reports with my CA?",
                        "Yes. Add CA details and enable the reports you want to share.",
                      ],
                    ].map(([question, answer]) => (
                      <details key={question} className="group p-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                          {question}
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {answer}
                        </p>
                      </details>
                    ))}
                  </Card>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <Modal
        open={userModal}
        onClose={() => setUserModal(false)}
        title="Add user"
        description="Create a workspace account with role-based access"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUserModal(false)}>
              Cancel
            </Button>
            <Button onClick={inviteUser}>Add user</Button>
          </>
        }
      >
        <form onSubmit={inviteUser} className="grid gap-4 sm:grid-cols-2">
          <SettingField label="Full name">
            <Input
              required
              value={userForm.name}
              onChange={(e) =>
                setUserForm({ ...userForm, name: e.target.value })
              }
            />
          </SettingField>
          <SettingField label="Email">
            <Input
              required
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
            />
          </SettingField>
          <SettingField label="Role">
            <Select
              value={userForm.role}
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value })
              }
            >
              <option>Admin</option>
              <option>Accountant</option>
              <option>Sales</option>
              <option>Viewer</option>
            </Select>
          </SettingField>
          <SettingField label="Temporary password" className="sm:col-span-2">
            <Input
              required
              type="password"
              minLength={8}
              value={userForm.password}
              onChange={(e) =>
                setUserForm({ ...userForm, password: e.target.value })
              }
              placeholder="Minimum 8 characters"
            />
          </SettingField>
        </form>
      </Modal>

      <Modal
        open={caModal}
        onClose={() => setCaModal(false)}
        title="CA reports sharing"
        description="Add your Chartered Accountant for scheduled report sharing"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCaModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (await save("caSharing")) setCaModal(false);
              }}
            >
              Save CA
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <SettingField label="CA name">
            <Input
              value={settings.caSharing.name}
              onChange={(e) =>
                updateSection("caSharing", "name", e.target.value)
              }
            />
          </SettingField>
          <SettingField label="CA WhatsApp number">
            <Input
              value={settings.caSharing.phone}
              onChange={(e) =>
                updateSection("caSharing", "phone", e.target.value)
              }
            />
          </SettingField>
          <SettingField label="CA email (optional)">
            <Input
              type="email"
              value={settings.caSharing.email}
              onChange={(e) =>
                updateSection("caSharing", "email", e.target.value)
              }
            />
          </SettingField>
          <div className="rounded-lg bg-warning/10 p-3 text-xs text-warning-foreground">
            Reports will be prepared according to the selected schedule.
            External WhatsApp/email delivery requires provider credentials.
          </div>
        </div>
      </Modal>
    </>
  );
}

export default SettingsPage;
