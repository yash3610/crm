import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";
import Invoice from "../models/Invoice.js";
import Notification from "../models/Notification.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const trendRanges = {
  "1m": { months: 1, groupByDay: true },
  "3m": { months: 3 },
  "6m": { months: 6 },
  "1y": { months: 12 },
  overall: {},
};

function getTrendSettings(value, now) {
  const range = Object.hasOwn(trendRanges, value) ? value : "6m";
  const settings = trendRanges[range];

  if (range === "overall") {
    return { range, start: null, groupByDay: false };
  }
  if (settings.groupByDay) {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 29);
    start.setUTCHours(0, 0, 0, 0);
    return { range, start, groupByDay: true };
  }

  return {
    range,
    start: new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - settings.months + 1,
        1,
      ),
    ),
    months: settings.months,
    groupByDay: false,
  };
}

function trendPipeline({ tenantId, start, groupByDay, isRevenue }) {
  const match = {
    tenantId,
    ...(start ? { date: { $gte: start } } : {}),
    ...(isRevenue ? { status: { $nin: ["draft", "cancelled"] } } : {}),
  };
  const format = groupByDay ? "%Y-%m-%d" : "%Y-%m";

  return [
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: "$date",
            timezone: "UTC",
          },
        },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ];
}

function buildTrend(result, expenseResult, settings, now) {
  const revenueByPeriod = new Map(
    result.map((item) => [item._id, item.total]),
  );
  const expensesByPeriod = new Map(
    expenseResult.map((item) => [item._id, item.total]),
  );
  let periods = [];

  if (settings.groupByDay) {
    periods = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(settings.start);
      date.setUTCDate(date.getUTCDate() + index);
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }),
      };
    });
  } else if (settings.range === "overall") {
    const keys = [
      ...new Set([...revenueByPeriod.keys(), ...expensesByPeriod.keys()]),
    ].sort();
    if (keys.length) {
      const [startYear, startMonth] = keys[0].split("-").map(Number);
      const monthCount =
        (now.getUTCFullYear() - startYear) * 12 +
        now.getUTCMonth() -
        (startMonth - 1) +
        1;
      periods = Array.from({ length: monthCount }, (_, index) => {
        const date = new Date(Date.UTC(startYear, startMonth - 1 + index, 1));
        return {
          key: date.toISOString().slice(0, 7),
          label: date.toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
            timeZone: "UTC",
          }),
        };
      });
    }
  } else {
    periods = Array.from({ length: settings.months }, (_, index) => {
      const date = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() - settings.months + 1 + index,
          1,
        ),
      );
      return {
        key: date.toISOString().slice(0, 7),
        label: date.toLocaleDateString("en-IN", {
          month: "short",
          timeZone: "UTC",
        }),
      };
    });
  }

  return periods.map(({ key, label }) => ({
    month: label,
    sales: revenueByPeriod.get(key) || 0,
    expenses: expensesByPeriod.get(key) || 0,
  }));
}

export const getDashboard = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const now = new Date();
  const trendSettings = getTrendSettings(req.query.range, now);
  const [
    revenueResult,
    outstandingResult,
    expenseResult,
    revenueTrendResult,
    expenseTrendResult,
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
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $max: [
                0,
                {
                  $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }],
                },
              ],
            },
          },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { tenantId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Invoice.aggregate(
      trendPipeline({ tenantId, ...trendSettings, isRevenue: true }),
    ),
    Expense.aggregate(
      trendPipeline({ tenantId, ...trendSettings, isRevenue: false }),
    ),
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

  const revenueExpenseTrend = buildTrend(
    revenueTrendResult,
    expenseTrendResult,
    trendSettings,
    now,
  );

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
      revenueExpenseTrend,
      recentInvoices: invoiceData,
      notifications,
    },
  });
});
