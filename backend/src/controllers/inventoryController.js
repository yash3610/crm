import Invoice from "../models/Invoice.js";
import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import StockMovement from "../models/StockMovement.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../utils/createNotification.js";
import { generateCode } from "../utils/generateCode.js";

function normalizeProduct(product) {
  const item = product.toJSON();
  item.mongoId = item.id;
  item.id = item.productId;
  return item;
}

function normalizeMovement(movement, sourceStatusByKey = new Map()) {
  const item = movement.toJSON();
  item.mongoId = item.id;
  item.id = item.movementId;
  const sourceKey = `${item.sourceType}:${String(item.sourceId || "")}`;
  item.sourceStatus = sourceStatusByKey.get(sourceKey) || null;
  return item;
}

export const getInventory = asyncHandler(async (req, res) => {
  const [products, movements] = await Promise.all([
    Product.find({ tenantId: req.tenantId }).sort("name"),
    StockMovement.find({ tenantId: req.tenantId })
      .sort("-createdAt")
      .limit(10),
  ]);
  const invoiceIds = movements
    .filter((movement) => movement.sourceType === "invoice" && movement.sourceId)
    .map((movement) => movement.sourceId);
  const purchaseIds = movements
    .filter((movement) => movement.sourceType === "purchase" && movement.sourceId)
    .map((movement) => movement.sourceId);
  const [invoices, purchases] = await Promise.all([
    invoiceIds.length
      ? Invoice.find({ tenantId: req.tenantId, _id: { $in: invoiceIds } })
          .select("status")
          .lean()
      : [],
    purchaseIds.length
      ? Purchase.find({ tenantId: req.tenantId, _id: { $in: purchaseIds } })
          .select("status")
          .lean()
      : [],
  ]);
  const sourceStatusByKey = new Map([
    ...invoices.map((invoice) => [`invoice:${String(invoice._id)}`, invoice.status]),
    ...purchases.map((purchase) => [
      `purchase:${String(purchase._id)}`,
      purchase.status,
    ]),
  ]);

  res.json({
    success: true,
    data: {
      products: products.map(normalizeProduct),
      movements: movements.map((movement) =>
        normalizeMovement(movement, sourceStatusByKey),
      ),
    },
  });
});

export const adjustStock = asyncHandler(async (req, res) => {
  const { productId, type, qty, reason } = req.body;
  const quantity = Number(qty);

  if (!productId || !["in", "out"].includes(type) || quantity <= 0) {
    throw new ApiError(400, "Product, movement type and quantity are required");
  }

  const product = await Product.findOne({
    tenantId: req.tenantId,
    productId,
  });
  if (!product) throw new ApiError(404, "Product not found");

  const nextStock =
    type === "in" ? product.stock + quantity : product.stock - quantity;
  if (nextStock < 0) throw new ApiError(400, "Insufficient stock");

  product.stock = nextStock;
  await product.save();

  const movement = await StockMovement.create({
    tenantId: req.tenantId,
    movementId: generateCode("M"),
    product: product._id,
    sku: product.sku,
    productName: product.name,
    type,
    qty: quantity,
    reason,
    sourceType: "adjustment",
  });

  if (product.stock <= 5) {
    await createNotification({
      tenantId: req.tenantId,
      type: product.stock === 0 ? "error" : "warning",
      category: "inventory",
      title: product.stock === 0 ? "Product out of stock" : "Low stock alert",
      body: `${product.name} has ${product.stock} ${product.unit} remaining`,
      actionUrl: "/inventory",
    });
  }

  res.status(201).json({
    success: true,
    message: "Stock adjusted successfully",
    data: {
      product: normalizeProduct(product),
      movement: normalizeMovement(movement),
    },
  });
});
