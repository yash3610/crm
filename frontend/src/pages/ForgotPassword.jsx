import { Link } from "react-router-dom";
import { useState } from "react";
import { AuthPanel } from "@/components/auth/AuthLayout";
import { Button, Input } from "@/components/common/Primitives";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  CONTACT_LIMITS,
  normalizeEmail,
  validateEmail,
} from "@/lib/contactValidation";
function ForgotPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [developmentResetUrl, setDevelopmentResetUrl] = useState("");
  return (
    <AuthPanel
      title="Reset your password"
      subtitle="We'll email you a secure link to set a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="text-center py-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-success/15 text-success grid place-items-center mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">Check your inbox</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a reset link. It expires in 30 minutes.
          </p>
          {developmentResetUrl && (
            <a
              href={developmentResetUrl}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Open development reset link
            </a>
          )}
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const email = normalizeEmail(
              new FormData(e.currentTarget).get("email"),
            );
            const emailError = validateEmail(email, { required: true });
            if (emailError) return toast.error(emailError);
            try {
              setLoading(true);
              const result = await api.post("/auth/forgot-password", { email });
              setDevelopmentResetUrl(result?.developmentResetUrl || "");
              setSent(true);
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
            <Input
              name="email"
              type="email"
              required
              className="mt-1.5"
              autoComplete="email"
              maxLength={CONTACT_LIMITS.email}
            />
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthPanel>
  );
}

export default ForgotPage;
