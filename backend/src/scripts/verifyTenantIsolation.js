import "dotenv/config";

import assert from "node:assert/strict";
import mongoose from "mongoose";

import app from "../app.js";
import { connectDatabase } from "../config/db.js";
import Branch from "../models/Branch.js";
import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";
import Invoice from "../models/Invoice.js";
import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import Quotation from "../models/Quotation.js";
import Setting from "../models/Setting.js";
import StockMovement from "../models/StockMovement.js";
import Supplier from "../models/Supplier.js";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

const tenantModels = [
  Branch,
  Customer,
  Expense,
  Invoice,
  Notification,
  Payment,
  Product,
  Purchase,
  Quotation,
  Setting,
  StockMovement,
  Supplier,
  User,
];

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

async function cleanup(tenantIds) {
  await Promise.all(
    tenantModels.map((Model) =>
      Model.deleteMany({ tenantId: { $in: tenantIds } }),
    ),
  );
  await Tenant.deleteMany({ _id: { $in: tenantIds } });
}

async function verify() {
  await connectDatabase();
  const server = app.listen(0);
  const tenantIds = [];

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api`;
    const suffix = Date.now().toString(36);

    const registrations = await Promise.all(
      ["Alpha", "Beta"].map((company) =>
        request(baseUrl, "/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: `${company} Owner`,
            company: `${company} ${suffix}`,
            email: `${company.toLowerCase()}.${suffix}@example.com`,
            password: "TenantTest@123",
          }),
        }),
      ),
    );

    registrations.forEach(({ status, body }) => {
      assert.equal(status, 201);
      tenantIds.push(body.data.user.tenantId);
    });

    const [alphaToken, betaToken] = registrations.map(
      ({ body }) => body.data.token,
    );
    const unauthenticated = await request(baseUrl, "/products");
    assert.equal(unauthenticated.status, 401);

    const invalidToken = await request(baseUrl, "/products", {
      headers: { authorization: "Bearer invalid-token" },
    });
    assert.equal(invalidToken.status, 401);

    const securityHeaders = await fetch(`${baseUrl}/health`);
    assert.equal(
      securityHeaders.headers.get("x-content-type-options"),
      "nosniff",
    );
    assert.equal(securityHeaders.headers.get("x-frame-options"), "DENY");

    const blockedOrigin = await fetch(`${baseUrl}/health`, {
      headers: { origin: "https://malicious.example" },
    });
    assert.equal(blockedOrigin.status, 403);

    const maliciousPayload = await request(baseUrl, "/products", {
      method: "POST",
      headers: { authorization: `Bearer ${alphaToken}` },
      body: JSON.stringify({
        name: "Unsafe",
        category: "Test",
        price: 1,
        stock: 1,
        $where: "return true",
      }),
    });
    assert.equal(maliciousPayload.status, 400);

    const createProduct = (token, name) =>
      request(baseUrl, "/products", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: "SHARED-PRODUCT",
          sku: "SHARED-SKU",
          name,
          category: "Isolation Test",
          price: 100,
          stock: 5,
        }),
      });

    const [alphaProduct, betaProduct] = await Promise.all([
      createProduct(alphaToken, "Alpha Product"),
      createProduct(betaToken, "Beta Product"),
    ]);
    assert.equal(alphaProduct.status, 201);
    assert.equal(betaProduct.status, 201);

    const [alphaList, betaList] = await Promise.all([
      request(baseUrl, "/products", {
        headers: { authorization: `Bearer ${alphaToken}` },
      }),
      request(baseUrl, "/products", {
        headers: { authorization: `Bearer ${betaToken}` },
      }),
    ]);

    assert.deepEqual(
      alphaList.body.data.map((item) => item.name),
      ["Alpha Product"],
    );
    assert.deepEqual(
      betaList.body.data.map((item) => item.name),
      ["Beta Product"],
    );

    const crossTenantRead = await request(
      baseUrl,
      `/products/${betaProduct.body.data.mongoId}`,
      { headers: { authorization: `Bearer ${alphaToken}` } },
    );
    assert.equal(crossTenantRead.status, 404);

    const crossTenantUpdate = await request(
      baseUrl,
      `/products/${betaProduct.body.data.mongoId}`,
      {
        method: "PATCH",
        headers: { authorization: `Bearer ${alphaToken}` },
        body: JSON.stringify({ name: "Compromised" }),
      },
    );
    assert.equal(crossTenantUpdate.status, 404);

    const crossTenantDelete = await request(
      baseUrl,
      `/products/${betaProduct.body.data.mongoId}`,
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${alphaToken}` },
      },
    );
    assert.equal(crossTenantDelete.status, 404);

    const viewerEmail = `viewer.${suffix}@example.com`;
    const viewerCreate = await request(baseUrl, "/users", {
      method: "POST",
      headers: { authorization: `Bearer ${alphaToken}` },
      body: JSON.stringify({
        name: "Read Only User",
        email: viewerEmail,
        role: "Viewer",
        password: "ViewerTest@123",
      }),
    });
    assert.equal(viewerCreate.status, 201);

    const viewerLogin = await request(baseUrl, "/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: viewerEmail,
        password: "ViewerTest@123",
      }),
    });
    assert.equal(viewerLogin.status, 200);
    const viewerToken = viewerLogin.body.data.token;

    const viewerRead = await request(baseUrl, "/products", {
      headers: { authorization: `Bearer ${viewerToken}` },
    });
    assert.equal(viewerRead.status, 200);

    const viewerWrite = await createProduct(viewerToken, "Forbidden Product");
    assert.equal(viewerWrite.status, 403);

    const adminEmail = `admin.${suffix}@example.com`;
    const adminCreate = await request(baseUrl, "/users", {
      method: "POST",
      headers: { authorization: `Bearer ${alphaToken}` },
      body: JSON.stringify({
        name: "Workspace Admin",
        email: adminEmail,
        role: "Admin",
        password: "AdminTest@123",
      }),
    });
    assert.equal(adminCreate.status, 201);

    const adminLogin = await request(baseUrl, "/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: adminEmail,
        password: "AdminTest@123",
      }),
    });
    const adminToken = adminLogin.body.data.token;
    const ownerId = registrations[0].body.data.user.id;
    const adminEditsOwner = await request(baseUrl, `/users/${ownerId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "inactive" }),
    });
    assert.equal(adminEditsOwner.status, 403);

    console.log(
      "Tenant isolation and API authorization verified successfully.",
    );
  } finally {
    if (tenantIds.length) await cleanup(tenantIds);
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
