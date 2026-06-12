import "dotenv/config";

import assert from "node:assert/strict";
import mongoose from "mongoose";

import app from "../app.js";
import { connectDatabase } from "../config/db.js";
import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import StockMovement from "../models/StockMovement.js";
import Supplier from "../models/Supplier.js";
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
  return { status: response.status, body: await response.json() };
}

async function cleanup(tenantIds) {
  const models = [
    Customer,
    Invoice,
    Payment,
    Product,
    Purchase,
    StockMovement,
    Supplier,
    User,
  ];
  await Promise.all(
    models.map((Model) => Model.deleteMany({ tenantId: { $in: tenantIds } })),
  );
  await Tenant.deleteMany({ _id: { $in: tenantIds } });
}

async function verify() {
  await connectDatabase();
  const server = app.listen(0);
  const tenantIds = [];

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
    const suffix = Date.now().toString(36);
    const register = (name) =>
      request(baseUrl, "/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: `${name} Owner`,
          company: `${name} Flow ${suffix}`,
          email: `${name.toLowerCase()}.${suffix}@example.com`,
          password: "BusinessTest@123",
        }),
      });
    const [alpha, beta] = await Promise.all([
      register("Alpha"),
      register("Beta"),
    ]);
    assert.equal(alpha.status, 201);
    assert.equal(beta.status, 201);
    tenantIds.push(alpha.body.data.user.tenantId, beta.body.data.user.tenantId);
    const auth = (token) => ({ authorization: `Bearer ${token}` });
    const alphaToken = alpha.body.data.token;
    const betaToken = beta.body.data.token;

    const product = await request(baseUrl, "/products", {
      method: "POST",
      headers: auth(alphaToken),
      body: JSON.stringify({
        sku: `FLOW-${suffix}`,
        name: "Flow Product",
        category: "Test",
        price: 200,
        stock: 10,
        gst: 18,
      }),
    });
    const customer = await request(baseUrl, "/customers", {
      method: "POST",
      headers: auth(alphaToken),
      body: JSON.stringify({ name: "Flow Customer" }),
    });
    const supplier = await request(baseUrl, "/suppliers", {
      method: "POST",
      headers: auth(alphaToken),
      body: JSON.stringify({ name: "Flow Supplier" }),
    });
    [product, customer, supplier].forEach(({ status }) =>
      assert.equal(status, 201),
    );

    const purchase = await request(baseUrl, "/purchases", {
      method: "POST",
      headers: auth(alphaToken),
      body: JSON.stringify({
        number: `PUR-${suffix}`,
        supplierRef: supplier.body.data.mongoId,
        supplierBillNumber: `SUP-${suffix}`,
        date: "2026-06-12",
        dueDate: "2026-06-26",
        status: "paid",
        lines: [
          {
            product: product.body.data.mongoId,
            name: "Flow Product",
            qty: 5,
            price: 100,
            gst: 18,
            discount: 0,
          },
        ],
      }),
    });
    assert.equal(purchase.status, 201);
    assert.equal(purchase.body.data.status, "pending");
    assert.equal(purchase.body.data.amount, 590);

    let productRead = await request(
      baseUrl,
      `/products/${product.body.data.id}`,
      { headers: auth(alphaToken) },
    );
    assert.equal(productRead.body.data.stock, 15);
    let supplierRead = await request(
      baseUrl,
      `/suppliers/${supplier.body.data.id}`,
      { headers: auth(alphaToken) },
    );
    assert.equal(supplierRead.body.data.payable, 590);

    const purchasePayment = await request(
      baseUrl,
      `/purchases/${purchase.body.data.id}/pay`,
      {
        method: "POST",
        headers: auth(alphaToken),
        body: JSON.stringify({
          amount: 590,
          date: "2026-06-12",
          method: "bank",
          reference: "PURCHASE-FULL",
        }),
      },
    );
    assert.equal(purchasePayment.status, 201);
    assert.equal(purchasePayment.body.data.status, "paid");
    supplierRead = await request(
      baseUrl,
      `/suppliers/${supplier.body.data.id}`,
      { headers: auth(alphaToken) },
    );
    assert.equal(supplierRead.body.data.payable, 0);

    const invoice = await request(baseUrl, "/invoices", {
      method: "POST",
      headers: auth(alphaToken),
      body: JSON.stringify({
        number: `INV-${suffix}`,
        customer: customer.body.data.mongoId,
        customerName: "Forged Name",
        date: "2026-06-12",
        dueDate: "2026-06-26",
        status: "paid",
        lines: [
          {
            product: product.body.data.mongoId,
            name: "Flow Product",
            qty: 3,
            price: 200,
            gst: 18,
            discount: 0,
          },
        ],
      }),
    });
    assert.equal(invoice.status, 201);
    assert.equal(invoice.body.data.status, "pending");
    assert.equal(invoice.body.data.customer, "Flow Customer");
    assert.equal(invoice.body.data.amount, 708);
    productRead = await request(baseUrl, `/products/${product.body.data.id}`, {
      headers: auth(alphaToken),
    });
    assert.equal(productRead.body.data.stock, 12);

    const betaInvoiceRead = await request(
      baseUrl,
      `/invoices/${invoice.body.data.id}`,
      { headers: auth(betaToken) },
    );
    assert.equal(betaInvoiceRead.status, 404);
    const betaPurchasePay = await request(
      baseUrl,
      `/purchases/${purchase.body.data.id}/pay`,
      {
        method: "POST",
        headers: auth(betaToken),
        body: JSON.stringify({ amount: 1, method: "cash", date: "2026-06-12" }),
      },
    );
    assert.equal(betaPurchasePay.status, 404);

    const overpayment = await request(baseUrl, "/payments", {
      method: "POST",
      headers: auth(alphaToken),
      body: JSON.stringify({
        invoice: invoice.body.data.mongoId,
        amount: 709,
        date: "2026-06-12",
        method: "upi",
      }),
    });
    assert.equal(overpayment.status, 400);
    const partialPayment = await request(baseUrl, "/payments", {
      method: "POST",
      headers: auth(alphaToken),
      body: JSON.stringify({
        invoice: invoice.body.data.mongoId,
        amount: 300,
        date: "2026-06-12",
        method: "upi",
      }),
    });
    assert.equal(partialPayment.status, 201);
    const fullPayment = await request(baseUrl, "/payments", {
      method: "POST",
      headers: auth(alphaToken),
      body: JSON.stringify({
        invoice: invoice.body.data.mongoId,
        amount: 408,
        date: "2026-06-12",
        method: "bank",
      }),
    });
    assert.equal(fullPayment.status, 201);
    const invoiceRead = await request(
      baseUrl,
      `/invoices/${invoice.body.data.id}`,
      { headers: auth(alphaToken) },
    );
    assert.equal(invoiceRead.body.data.status, "paid");
    assert.equal(invoiceRead.body.data.paidAmount, 708);
    const customerRead = await request(
      baseUrl,
      `/customers/${customer.body.data.id}`,
      { headers: auth(alphaToken) },
    );
    assert.equal(customerRead.body.data.outstanding, 0);
    assert.equal(customerRead.body.data.totalBilled, 708);

    const mutatePayment = await request(
      baseUrl,
      `/payments/${partialPayment.body.data.id}`,
      {
        method: "PATCH",
        headers: auth(alphaToken),
        body: JSON.stringify({ amount: 1 }),
      },
    );
    assert.equal(mutatePayment.status, 409);
    const deleteInvoice = await request(
      baseUrl,
      `/invoices/${invoice.body.data.id}`,
      { method: "DELETE", headers: auth(alphaToken) },
    );
    assert.equal(deleteInvoice.status, 409);

    console.log("Sales, purchase, stock and payment flows verified.");
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
