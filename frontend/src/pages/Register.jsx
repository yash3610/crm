import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthPanel } from "@/components/auth/AuthLayout";
import { Button, Input } from "@/components/common/Primitives";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  CONTACT_LIMITS,
  normalizeEmail,
  normalizeName,
  validateEmail,
  validateName,
} from "@/lib/contactValidation";

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
    <AuthPanel
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
          const payload = {
            name: normalizeName(`${form.firstName} ${form.lastName}`),
            company: normalizeName(form.company),
            email: normalizeEmail(form.email),
            password: form.password,
          };
          const nameError = validateName(payload.name, "Name");
          if (nameError) return toast.error(nameError);
          const companyError = validateName(payload.company, "Company");
          if (companyError) return toast.error(companyError);
          const emailError = validateEmail(payload.email, { required: true });
          if (emailError) return toast.error(emailError);
          try {
            setLoading(true);
            await register(payload);
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
              autoComplete="given-name"
              className="mt-1.5"
              value={form.firstName}
              onChange={(event) =>
                setForm({ ...form, firstName: event.target.value })
              }
              maxLength={60}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Last name
            </span>
            <Input
              required
              autoComplete="family-name"
              className="mt-1.5"
              value={form.lastName}
              onChange={(event) =>
                setForm({ ...form, lastName: event.target.value })
              }
              maxLength={60}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Company
          </span>
          <Input
            required
            autoComplete="organization"
            className="mt-1.5"
            value={form.company}
            onChange={(event) =>
              setForm({ ...form, company: event.target.value })
            }
            maxLength={CONTACT_LIMITS.name}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Work email
          </span>
          <Input
            type="email"
            required
            autoComplete="email"
            className="mt-1.5"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            maxLength={CONTACT_LIMITS.email}
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
            maxLength={128}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}"
            title="Use 8-128 characters with uppercase, lowercase and a number"
            autoComplete="new-password"
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
    </AuthPanel>
  );
}

export default RegisterPage;
