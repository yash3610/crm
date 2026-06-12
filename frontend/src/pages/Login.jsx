import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button, Input } from "@/components/common/Primitives";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "admin@billpro.io",
    password: "demo1234",
  });
  const socialProviders = [
    { name: "Google", url: import.meta.env.VITE_GOOGLE_AUTH_URL },
    { name: "Microsoft", url: import.meta.env.VITE_MICROSOFT_AUTH_URL },
  ];
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your BillPro workspace."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setLoading(true);
            await login(form);
            toast.success("Signed in");
            nav("/");
          } catch (error) {
            toast.error(error.message);
          } finally {
            setLoading(false);
          }
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Email
          </span>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              className="pl-9"
            />
          </div>
        </label>
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Password
            </span>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={show ? "text" : "password"}
              required
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              className="pl-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded border-border text-primary"
          />{" "}
          Remember me
        </label>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">
              or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {socialProviders.map((provider) => (
            <Button
              key={provider.name}
              variant="outline"
              type="button"
              disabled={!provider.url}
              title={
                provider.url
                  ? `Continue with ${provider.name}`
                  : `${provider.name} login is not configured`
              }
              onClick={() => {
                if (provider.url) window.location.assign(provider.url);
              }}
            >
              {provider.name}
            </Button>
          ))}
        </div>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
