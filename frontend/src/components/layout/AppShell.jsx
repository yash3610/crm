import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  Boxes,
  FileText,
  FilePlus2,
  Receipt,
  Wallet,
  CreditCard,
  TrendingUp,
  Calculator,
  Settings,
  Building2,
  Shield,
  Bell,
  Search,
  Menu,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
const nav = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { to: "/invoices", label: "Invoices", icon: FileText },
      { to: "/invoices/new", label: "Create Invoice", icon: FilePlus2 },
      { to: "/quotations", label: "Quotations", icon: Receipt },
      { to: "/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    label: "Purchasing",
    items: [
      { to: "/suppliers", label: "Suppliers", icon: Truck },
      { to: "/purchases", label: "Purchases", icon: Wallet },
      { to: "/expenses", label: "Expenses", icon: Wallet },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/products", label: "Products", icon: Package },
      { to: "/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/reports", label: "Reports", icon: TrendingUp },
      { to: "/accounting", label: "Accounting", icon: Calculator },
    ],
  },
  {
    label: "Admin",
    items: [
      { to: "/users", label: "Users & Roles", icon: Shield },
      { to: "/branches", label: "Branches", icon: Building2 },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];
function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("bp-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefers;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("bp-theme", next ? "dark" : "light");
  };
  return { dark, toggle };
}
function NavList({ onNavigate }) {
  const { pathname } = useLocation();
  const isActive = (to) =>
    to === "/"
      ? pathname === "/"
      : pathname === to || pathname.startsWith(to + "/");
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {nav.map((sec) => (
        <div key={sec.label}>
          <div className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {sec.label}
          </div>
          <ul className="space-y-0.5">
            {sec.items.map((it) => {
              const active = isActive(it.to);
              const Icon = it.icon;
              return (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span>{it.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border"
    >
      <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-soft">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <div className="font-semibold text-foreground">BillPro</div>
        <div className="text-[11px] text-muted-foreground">ERP Suite</div>
      </div>
    </Link>
  );
}
export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { dark, toggle } = useDark();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const loadNotifications = useCallback(async () => {
    try {
      const data = await api.get("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    }
  }, []);
  useEffect(() => {
    loadNotifications();
    const refresh = () => loadNotifications();
    window.addEventListener("notifications:updated", refresh);
    return () => window.removeEventListener("notifications:updated", refresh);
  }, [loadNotifications]);
  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);
  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all", {});
      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true })),
      );
      window.dispatchEvent(new Event("notifications:updated"));
    } catch {
      // Leave the current state unchanged when the request fails.
    }
  };
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        <NavList />
        <div className="p-3 border-t border-sidebar-border">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-sidebar-accent/60"
          >
            <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground grid place-items-center text-xs font-semibold">
              {initials || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{user?.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {user?.email}
              </div>
            </div>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 h-full flex flex-col bg-sidebar border-r border-sidebar-border">
            <Brand />
            <NavList onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
          <button
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search invoices, customers, products…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent focus:bg-background focus:border-border outline-none text-sm transition-colors"
            />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={toggle}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border hover:bg-accent"
              aria-label="Toggle theme"
            >
              {dark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setUserMenuOpen(false);
                  if (!notificationsOpen) loadNotifications();
                }}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div>
                      <div className="font-semibold">Notifications</div>
                      <div className="text-xs text-muted-foreground">
                        {unreadCount} unread
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <div
                          key={item._id || item.id}
                          className="flex gap-3 border-b border-border px-4 py-3 last:border-0"
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              item.read
                                ? "bg-muted-foreground/30"
                                : "bg-primary",
                            )}
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {item.title}
                            </div>
                            <div className="line-clamp-2 text-xs text-muted-foreground">
                              {item.body || item.message}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/notifications")}
                    className="w-full border-t border-border px-4 py-3 text-sm font-medium text-primary hover:bg-muted"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
            <div className="relative hidden border-l border-border pl-3 sm:block">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((open) => !open);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-accent"
                aria-label="Open user menu"
                aria-expanded={userMenuOpen}
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {initials || "U"}
                </div>
                <div className="hidden max-w-32 text-left md:block">
                  <div className="truncate text-sm font-medium">
                    {user?.name}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {user?.role}
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    userMenuOpen && "rotate-180",
                  )}
                />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
                  <div className="border-b border-border px-4 py-3">
                    <div className="truncate font-semibold">{user?.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </div>
                    <div className="mt-1 text-xs capitalize text-muted-foreground">
                      {user?.role}
                      {user?.tenant?.name ? ` - ${user.tenant.name}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/settings")}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-muted"
                  >
                    Account settings
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-destructive hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
