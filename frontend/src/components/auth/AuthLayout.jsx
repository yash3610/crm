import { Sparkles, TrendingUp, ShieldCheck, Zap } from "lucide-react";
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary-foreground/15 grid place-items-center backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">BillPro</div>
            <div className="text-xs opacity-80">ERP Suite</div>
          </div>
        </div>
        <div className="relative space-y-6 max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight">
            Run your entire business from one premium dashboard.
          </h2>
          <p className="opacity-90 text-sm">
            Invoicing, inventory, accounting and reports — all in one place.
            Trusted by 12,000+ growing teams.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <TrendingUp className="h-4 w-4" /> Real-time business insights
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4" /> GST-compliant invoicing
            </li>
            <li className="flex items-center gap-2.5">
              <Zap className="h-4 w-4" /> Multi-user workspace ready
            </li>
          </ul>
        </div>
        <div className="relative text-xs opacity-80">
          © 2026 BillPro Industries. All rights reserved.
        </div>
      </div>
      <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="font-semibold">BillPro</div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && (
            <div className="mt-6 text-sm text-muted-foreground text-center">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
