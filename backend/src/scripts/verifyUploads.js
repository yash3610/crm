import "dotenv/config";

import assert from "node:assert/strict";
import { access, rm } from "node:fs/promises";
import path from "node:path";

import mongoose from "mongoose";

import app from "../app.js";
import { connectDatabase } from "../config/db.js";
import Branch from "../models/Branch.js";
import Setting from "../models/Setting.js";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";
import { uploadRoot } from "../utils/uploadStorage.js";

const webp = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

async function request(baseUrl, route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, options);
  return { status: response.status, body: await response.json() };
}

async function verify() {
  await connectDatabase();
  const server = app.listen(0);
  let tenantId;

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const suffix = Date.now().toString(36);
    const registration = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Upload Owner",
        company: `Upload Test ${suffix}`,
        email: `upload.${suffix}@example.com`,
        password: "UploadTest@123",
      }),
    });

    assert.equal(registration.status, 201);
    tenantId = registration.body.data.user.tenantId;
    const authorization = `Bearer ${registration.body.data.token}`;
    const upload = () =>
      request(baseUrl, "/api/settings/files/business/logo", {
        method: "POST",
        headers: {
          authorization,
          "content-type": "image/webp",
        },
        body: webp,
      });

    const first = await upload();
    assert.equal(first.status, 201);
    const firstPath = path.join(
      uploadRoot,
      tenantId,
      path.basename(first.body.data.url),
    );
    await access(firstPath);

    const second = await upload();
    assert.equal(second.status, 201);
    await assert.rejects(access(firstPath));
    await access(
      path.join(uploadRoot, tenantId, path.basename(second.body.data.url)),
    );

    const settings = await Setting.findOne({
      tenantId,
      key: "business",
    });
    assert.equal(settings.value.logo, second.body.data.url);

    console.log("Upload persistence and replacement cleanup verified.");
  } finally {
    if (tenantId) {
      await Promise.all([
        Branch.deleteMany({ tenantId }),
        Setting.deleteMany({ tenantId }),
        User.deleteMany({ tenantId }),
        Tenant.findByIdAndDelete(tenantId),
        rm(path.join(uploadRoot, tenantId), { recursive: true, force: true }),
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
