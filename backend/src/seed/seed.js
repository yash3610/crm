import "dotenv/config";

import mongoose from "mongoose";

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

const customers = [
  [
    "C001",
    "Acme Traders",
    "billing@acme.in",
    "+91 98101 22334",
    "Mumbai",
    48200,
    412000,
    "active",
  ],
  [
    "C002",
    "Nimbus Retail",
    "ap@nimbus.co",
    "+91 99880 11223",
    "Bengaluru",
    0,
    218500,
    "active",
  ],
  [
    "C003",
    "Patel & Sons",
    "office@patelsons.in",
    "+91 90909 80808",
    "Ahmedabad",
    12750,
    87500,
    "active",
  ],
  [
    "C004",
    "Coastal Foods",
    "accounts@coastal.in",
    "+91 97777 55443",
    "Kochi",
    152000,
    685000,
    "active",
  ],
  [
    "C005",
    "Northwind Co.",
    "hello@northwind.io",
    "+91 91111 23456",
    "Delhi",
    0,
    56000,
    "inactive",
  ],
].map(
  ([
    customerId,
    name,
    email,
    phone,
    city,
    outstanding,
    totalBilled,
    status,
  ]) => ({
    customerId,
    name,
    email,
    phone,
    city,
    outstanding,
    totalBilled,
    status,
  }),
);

const suppliers = [
  ["S001", "Maven Components", "R. Iyer", "+91 90000 11111", "Pune", 84000],
  ["S002", "Orbit Packaging", "S. Khan", "+91 90000 22222", "Surat", 12500],
  ["S003", "Vertex Hardware", "K. Mehta", "+91 90000 33333", "Rajkot", 0],
].map(([supplierId, name, contact, phone, city, payable]) => ({
  supplierId,
  name,
  contact,
  phone,
  city,
  payable,
}));

const products = [
  ["P001", "BP-WIDGET-01", "Premium Widget", "Widgets", 1499, 42, "pcs", 18],
  ["P002", "BP-GEAR-22", "Industrial Gear 22mm", "Hardware", 899, 8, "pcs", 18],
  [
    "P003",
    "BP-FILM-04",
    "Stretch Film Roll",
    "Packaging",
    320,
    156,
    "roll",
    12,
  ],
  ["P004", "BP-TEX-08", "Cotton Fabric 1m", "Textiles", 240, 3, "m", 5],
  ["P005", "BP-BOLT-M6", "Bolt M6 Pack", "Hardware", 180, 320, "pack", 18],
].map(([productId, sku, name, category, price, stock, unit, gst]) => ({
  productId,
  sku,
  name,
  category,
  price,
  stock,
  unit,
  gst,
}));

async function seed() {
  await connectDatabase();

  await Promise.all([
    Branch.deleteMany({}),
    Customer.deleteMany({}),
    Expense.deleteMany({}),
    Invoice.deleteMany({}),
    Notification.deleteMany({}),
    Payment.deleteMany({}),
    Product.deleteMany({}),
    Purchase.deleteMany({}),
    Quotation.deleteMany({}),
    Setting.deleteMany({}),
    StockMovement.deleteMany({}),
    Supplier.deleteMany({}),
    Tenant.deleteMany({}),
    User.deleteMany({}),
  ]);

  const tenant = await Tenant.create({
    name: "BillPro Industries Pvt Ltd",
    slug: "billpro-industries",
    plan: "premium",
  });
  const tenantId = tenant._id;
  const scoped = (items) => items.map((item) => ({ ...item, tenantId }));

  await Promise.all([
    Customer.insertMany(scoped(customers)),
    Supplier.insertMany(scoped(suppliers)),
    Product.insertMany(scoped(products)),
    Expense.insertMany(
      scoped([
        {
          expenseId: "E01",
          category: "Rent",
          vendor: "Skyline Estates",
          date: "2026-06-01",
          amount: 85000,
        },
        {
          expenseId: "E02",
          category: "Utilities",
          vendor: "City Power",
          date: "2026-06-02",
          amount: 12400,
        },
        {
          expenseId: "E03",
          category: "Salaries",
          vendor: "Payroll",
          date: "2026-05-31",
          amount: 540000,
        },
      ]),
    ),
    Quotation.insertMany(
      scoped([
        {
          quotationId: "Q1",
          number: "QUO-2026-0421",
          customer: "Acme Traders",
          date: "2026-06-04",
          validTill: "2026-06-18",
          amount: 84200,
          status: "sent",
        },
        {
          quotationId: "Q2",
          number: "QUO-2026-0420",
          customer: "Nimbus Retail",
          date: "2026-06-02",
          validTill: "2026-06-16",
          amount: 46500,
          status: "accepted",
        },
      ]),
    ),
    Purchase.insertMany(
      scoped([
        {
          purchaseId: "PO1",
          number: "PO-2026-0220",
          supplier: "Maven Components",
          date: "2026-06-03",
          amount: 184000,
          status: "pending",
        },
        {
          purchaseId: "PO2",
          number: "PO-2026-0219",
          supplier: "Orbit Packaging",
          date: "2026-06-01",
          amount: 42000,
          status: "paid",
        },
      ]),
    ),
    Branch.insertMany(
      scoped([
        {
          branchId: "B1",
          name: "HQ Mumbai",
          address: "Andheri East, Mumbai 400069",
          phone: "+91 22 4000 1100",
          team: 14,
          revenue: 1820000,
          status: "active",
        },
        {
          branchId: "B2",
          name: "Delhi",
          address: "Connaught Place, New Delhi 110001",
          phone: "+91 11 4500 2200",
          team: 7,
          revenue: 640000,
          status: "active",
        },
      ]),
    ),
    Notification.insertMany(
      scoped([
        {
          notificationId: "N1",
          type: "success",
          title: "Payment received",
          body: "Nimbus Retail paid INR 21,850",
        },
        {
          notificationId: "N2",
          type: "warning",
          title: "Invoice overdue",
          body: "INV-2026-1003 is past due",
        },
        {
          notificationId: "N3",
          type: "info",
          title: "Low stock alert",
          body: "Cotton Fabric 1m has 3 units left",
        },
      ]),
    ),
    Setting.insertMany(
      scoped([
        {
          key: "company",
          value: {
            name: "BillPro Industries Pvt Ltd",
            email: "hello@billpro.io",
            phone: "+91 22 4000 1100",
            address: "Andheri East, Mumbai 400069",
          },
        },
        {
          key: "tax",
          value: {
            gstin: "27AABCB1234C1Z5",
            currency: "INR",
            invoicePrefix: "INV",
          },
        },
      ]),
    ),
  ]);

  const customerDocs = await Customer.find({ tenantId });
  const customerMap = Object.fromEntries(
    customerDocs.map((item) => [item.name, item]),
  );

  await Invoice.insertMany([
    {
      tenantId,
      invoiceId: "I1001",
      number: "INV-2026-1001",
      customer: customerMap["Acme Traders"]._id,
      customerName: "Acme Traders",
      date: "2026-06-02",
      dueDate: "2026-06-16",
      amount: 48200,
      status: "pending",
    },
    {
      tenantId,
      invoiceId: "I1002",
      number: "INV-2026-1002",
      customer: customerMap["Nimbus Retail"]._id,
      customerName: "Nimbus Retail",
      date: "2026-06-01",
      dueDate: "2026-06-15",
      amount: 21850,
      status: "paid",
    },
    {
      tenantId,
      invoiceId: "I1003",
      number: "INV-2026-1003",
      customer: customerMap["Coastal Foods"]._id,
      customerName: "Coastal Foods",
      date: "2026-05-28",
      dueDate: "2026-06-04",
      amount: 152000,
      status: "overdue",
    },
  ]);

  const paidInvoice = await Invoice.findOne({ tenantId, invoiceId: "I1002" });
  await Payment.create({
    tenantId,
    paymentId: "PM01",
    invoice: paidInvoice._id,
    invoiceNumber: paidInvoice.number,
    customer: paidInvoice.customerName,
    date: "2026-06-03",
    amount: 21850,
    method: "upi",
  });

  await User.create({
    tenantId,
    userId: "U1",
    name: "Rahul Aggarwal",
    email: "admin@billpro.io",
    password: "demo1234",
    role: "Owner",
    branch: "HQ Mumbai",
    status: "active",
  });

  console.log("Seed complete. Login: admin@billpro.io / demo1234");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
