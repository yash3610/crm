import "dotenv/config";

import assert from "node:assert/strict";
import mongoose from "mongoose";

import app from "../app.js";
import { connectDatabase } from "../config/db.js";
import Setting from "../models/Setting.js";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
  });
  const body = await response.json();
  return { status: response.status, body };
}

async function verify() {
  await connectDatabase();
  const server = app.listen(0);
  let tenantId;

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api`;
    const suffix = Date.now().toString(36);
    const email = `auth.${suffix}@example.com`;

    const weakRegistration = await request(baseUrl, "/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Auth Test",
        company: `Auth Test ${suffix}`,
        email: `weak.${email}`,
        password: "alllowercase",
      }),
    });
    assert.equal(weakRegistration.status, 400);

    const registration = await request(baseUrl, "/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Auth Test",
        company: `Auth Test ${suffix}`,
        email,
        password: "OriginalPass123",
      }),
    });
    assert.equal(registration.status, 201);
    tenantId = registration.body.data.user.tenantId;
    const oldToken = registration.body.data.token;

    const wrongLogin = await request(baseUrl, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: "WrongPass123" }),
    });
    assert.equal(wrongLogin.status, 401);
    assert.equal(wrongLogin.body.message, "Invalid email or password");

    const forgot = await request(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    assert.equal(forgot.status, 200);
    assert.ok(forgot.body.data.developmentResetUrl);
    const resetToken = forgot.body.data.developmentResetUrl.split("/").at(-1);

    const reset = await request(baseUrl, `/auth/reset-password/${resetToken}`, {
      method: "POST",
      body: JSON.stringify({ password: "UpdatedPass123" }),
    });
    assert.equal(reset.status, 200);

    const reusedReset = await request(
      baseUrl,
      `/auth/reset-password/${resetToken}`,
      {
        method: "POST",
        body: JSON.stringify({ password: "AnotherPass123" }),
      },
    );
    assert.equal(reusedReset.status, 400);

    const oldSession = await request(baseUrl, "/auth/me", {
      headers: { authorization: `Bearer ${oldToken}` },
    });
    assert.equal(oldSession.status, 401);

    const oldPasswordLogin = await request(baseUrl, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: "OriginalPass123" }),
    });
    assert.equal(oldPasswordLogin.status, 401);

    const newPasswordLogin = await request(baseUrl, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: "UpdatedPass123" }),
    });
    assert.equal(newPasswordLogin.status, 200);

    const unknownAccount = await request(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: `unknown.${email}` }),
    });
    assert.equal(unknownAccount.status, 200);
    assert.equal(unknownAccount.body.data, undefined);

    console.log("Authentication flows verified successfully.");
  } finally {
    if (tenantId) {
      await Promise.all([
        User.deleteMany({ tenantId }),
        Setting.deleteMany({ tenantId }),
        Tenant.findByIdAndDelete(tenantId),
      ]);
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
