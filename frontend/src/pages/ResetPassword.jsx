import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { AuthPanel } from "@/components/auth/AuthLayout";
import { Button, Input } from "@/components/common/Primitives";
import { api } from "@/lib/api";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });

  return (
    <AuthPanel
      title="Choose a new password"
      subtitle="Use a strong password you have not used before."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {complete ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-success/15 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">Password updated</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You can now sign in with your new password.
          </p>
          <Button
            className="mt-5 w-full"
            onClick={() => navigate("/login", { replace: true })}
          >
            Continue to sign in
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (form.password !== form.confirmPassword) {
              toast.error("Passwords do not match");
              return;
            }
            try {
              setLoading(true);
              await api.post(`/auth/reset-password/${token}`, {
                password: form.password,
              });
              setComplete(true);
            } catch (error) {
              toast.error(error.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              New password
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
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Confirm password
            </span>
            <Input
              type="password"
              required
              autoComplete="new-password"
              className="mt-1.5"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm({ ...form, confirmPassword: event.target.value })
              }
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Use at least 8 characters with uppercase, lowercase and a number.
          </p>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Reset password"}
          </Button>
        </form>
      )}
    </AuthPanel>
  );
}

export default ResetPasswordPage;
