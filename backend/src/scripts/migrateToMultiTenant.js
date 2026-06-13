import "dotenv/config";

import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";
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

async function migrate() {
  await connectDatabase();

  let tenant = await Tenant.findOne({ slug: "legacy-workspace" });
  if (!tenant) {
    const companySetting = await Setting.findOne({ key: "company" }).lean();
    tenant = await Tenant.create({
      name:
        companySetting?.value?.name ||
        process.env.DEFAULT_TENANT_NAME ||
        "Default Workspace",
      slug: "legacy-workspace",
      plan: "premium",
    });
  }

  for (const Model of tenantModels) {
    const result = await Model.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenant._id } },
    );
    console.log(`${Model.modelName}: assigned ${result.modifiedCount} records`);
  }

  for (const Model of tenantModels) {
    await Model.syncIndexes();
    console.log(`${Model.modelName}: indexes synced`);
  }

  console.log(`Migration complete. Legacy tenant: ${tenant.name}`);
  await mongoose.disconnect();
}

migrate().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
