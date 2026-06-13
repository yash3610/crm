import { ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

export function AuthLayout({ title, subtitle, children, footer, heroVideo }) {
  const [videoReady, setVideoReady] = useState(false);

  return (
    <div className="grid min-h-screen bg-white lg:h-dvh lg:min-h-0 lg:grid-cols-2 lg:overflow-hidden">
      <div
        className={`relative hidden overflow-hidden p-10 text-primary-foreground lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:justify-between ${
          heroVideo
            ? "bg-white"
            : "bg-gradient-to-br from-primary via-primary to-primary/70"
        }`}
      >
        {heroVideo ? (
          <>
            <video
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                videoReady ? "opacity-100" : "opacity-0"
              }`}
              src={heroVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={() => setVideoReady(true)}
              aria-hidden="true"
            />
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${
                videoReady ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55 transition-opacity duration-300 ${
                videoReady ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        )}

        <div
          className={`relative flex items-center gap-2 transition-opacity duration-300 ${
            heroVideo && !videoReady ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">BillPro</div>
            <div className="text-xs text-white/80">ERP Suite</div>
          </div>
        </div>

        <div
          className={`relative max-w-sm transition-opacity duration-300 ${
            heroVideo && !videoReady ? "opacity-0" : "opacity-100"
          }`}
        >
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.65)]">
            Everything your business needs, in one place.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
            Manage invoicing, inventory, accounting and reports from one simple
            dashboard.
          </p>
          <ul className="mt-7 grid gap-4 text-sm font-medium text-white/95 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
            <li className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15">
                <TrendingUp className="h-4 w-4" />
              </span>
              Real-time business insights
            </li>
            <li className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15">
                <ShieldCheck className="h-4 w-4" />
              </span>
              GST-compliant invoicing
            </li>
            <li className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15">
                <Zap className="h-4 w-4" />
              </span>
              Multi-user workspace ready
            </li>
          </ul>
        </div>

        <div
          className={`relative text-xs text-white/80 transition-opacity duration-300 ${
            heroVideo && !videoReady ? "opacity-0" : "opacity-100"
          }`}
        >
          © 2026 BillPro Industries. All rights reserved.
        </div>
      </div>

      <div className="flex min-h-screen flex-col justify-center px-6 py-12 sm:px-10 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-16">
        {title ? (
          <AuthPanel title={title} subtitle={subtitle} footer={footer}>
            {children}
          </AuthPanel>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function AuthPanel({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="font-semibold">BillPro</div>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-8">{children}</div>
      {footer && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

export function VideoAuthLayout() {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-white" />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout heroVideo="/7ed64552-1180-11ee-a916-ab928951c9e0.mp4">
      <Outlet />
    </AuthLayout>
  );
}
