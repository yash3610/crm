import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";
import Invoice from "../models/Invoice.js";
import Notification from "../models/Notification.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const [
    revenueResult,
    outstandingResult,
    expenseResult,
    activeCustomers,
    lowStockItems,
    recentInvoices,
    notifications,
  ] = await Promise.all([
    Invoice.aggregate([
      { $match: { tenantId, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Invoice.aggregate([
      {
        $match: {
          tenantId,
          status: { $in: ["pending", "overdue"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: { tenantId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Customer.countDocuments({ tenantId, status: "active" }),
    Product.countDocuments({ tenantId, stock: { $lte: 10 } }),
    Invoice.find({ tenantId }).sort("-date").limit(5),
    Notification.find({ tenantId }).sort("-createdAt").limit(6),
  ]);

  const invoiceData = recentInvoices.map((invoice) => {
    const item = invoice.toJSON();
    item.id = item.invoiceId;
    item.customer = item.customerName;
    return item;
  });

  res.json({
    success: true,
    data: {
      summary: {
        revenue: revenueResult[0]?.total || 0,
        outstanding: outstandingResult[0]?.total || 0,
        expenses: expenseResult[0]?.total || 0,
        activeCustomers,
        lowStockItems,
      },
      recentInvoices: invoiceData,
      notifications,
    },
  });
});
