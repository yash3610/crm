import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button, Input } from "@/components/common/Primitives";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    password: "",
  });
  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Free 14-day trial. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setLoading(true);
            await register({
              name: `${form.firstName} ${form.lastName}`.trim(),
              company: form.company,
              email: form.email,
              password: form.password,
            });
            toast.success("Workspace created");
            nav("/");
          } catch (error) {
            toast.error(error.message);
          } finally {
            setLoading(false);
          }
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              First name
            </span>
            <Input
              required
              className="mt-1.5"
              value={form.firstName}
              onChange={(event) =>
                setForm({ ...form, firstName: event.target.value })
              }
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Last name
            </span>
            <Input
              required
              className="mt-1.5"
              value={form.lastName}
              onChange={(event) =>
                setForm({ ...form, lastName: event.target.value })
              }
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Company
          </span>
          <Input
            required
            className="mt-1.5"
            value={form.company}
            onChange={(event) =>
              setForm({ ...form, company: event.target.value })
            }
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Work email
          </span>
          <Input
            type="email"
            required
            className="mt-1.5"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Password
          </span>
          <Input
            type="password"
            required
            minLength={8}
            className="mt-1.5"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
          />
        </label>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            required
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-border text-primary"
          />
          <span>
            I agree to BillPro's{" "}
            <a className="text-primary hover:underline">Terms</a> and{" "}
            <a className="text-primary hover:underline">Privacy Policy</a>
          </span>
        </label>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating workspace…" : "Create workspace"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
