import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateCode } from "../utils/generateCode.js";

function normalizeProduct(product) {
  const item = product.toJSON();
  item.mongoId = item.id;
  item.id = item.productId;
  return item;
}

function normalizeMovement(movement) {
  const item = movement.toJSON();
  item.mongoId = item.id;
  item.id = item.movementId;
  return item;
}

export const getInventory = asyncHandler(async (req, res) => {
  const [products, movements] = await Promise.all([
    Product.find({ tenantId: req.tenantId }).sort("name"),
    StockMovement.find({ tenantId: req.tenantId })
      .sort("-createdAt")
      .limit(100),
  ]);

  res.json({
    success: true,
    data: {
      products: products.map(normalizeProduct),
      movements: movements.map(normalizeMovement),
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
  });

  res.status(201).json({
    success: true,
    message: "Stock adjusted successfully",
    data: {
      product: normalizeProduct(product),
      movement: normalizeMovement(movement),
    },
  });
});
