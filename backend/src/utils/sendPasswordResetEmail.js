function getClientUrl() {
  return (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");
}

export async function sendPasswordResetEmail({ email, resetToken }) {
  const resetUrl = `${getClientUrl()}/reset-password/${resetToken}`;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Password reset email service is not configured");
    }
    console.info(`Password reset link for ${email}: ${resetUrl}`);
    return resetUrl;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your BillPro password",
      html: `<p>Use the link below to reset your BillPro password. This link expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider returned ${response.status}`);
  }

  return resetUrl;
}
