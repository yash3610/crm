import { Link } from "react-router-dom";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button, Input } from "@/components/common/Primitives";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
function ForgotPage() {
  const [sent, setSent] = useState(false);
  return (
    <AuthLayout
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
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const email = new FormData(e.currentTarget).get("email");
            try {
              await api.post("/auth/forgot-password", { email });
              setSent(true);
            } catch (error) {
              toast.error(error.message);
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
              defaultValue="admin@billpro.io"
            />
          </label>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPage;
