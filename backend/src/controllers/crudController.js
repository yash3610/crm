import mongoose from "mongoose";

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateCode } from "../utils/generateCode.js";

function normalize(document, idField, transform) {
  const item = document.toJSON ? document.toJSON() : { ...document };
  item.mongoId = item.id;
  item.id = item[idField] || item.id;
  return transform ? transform(item) : item;
}

function resourceQuery(tenantId, id, idField) {
  const conditions = [{ [idField]: id }];
  if (mongoose.isValidObjectId(id)) conditions.push({ _id: id });
  return { tenantId, $or: conditions };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizePayload(payload, idField) {
  const clean = { ...payload };
  [
    "_id",
    "id",
    "mongoId",
    "__v",
    "tenantId",
    "createdAt",
    "updatedAt",
    idField,
  ].forEach((field) => delete clean[field]);
  return clean;
}

export function createCrudController({
  Model,
  idField,
  prefix,
  searchFields = [],
  defaultSort = "-createdAt",
  beforeCreate,
  afterCreate,
  beforeUpdate,
  beforeRemove,
  transform,
}) {
  const list = asyncHandler(async (req, res) => {
    const query = { tenantId: req.tenantId };
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    if (search && searchFields.length) {
      query.$or = searchFields.map((field) => ({
        [field]: { $regex: escapeRegex(search.slice(0, 100)), $options: "i" },
      }));
    }

    if (typeof req.query.status === "string") query.status = req.query.status;

    const requestedSort =
      typeof req.query.sort === "string" ? req.query.sort : "";
    const sortField = requestedSort.replace(/^-/, "");
    const allowedSortFields = new Set([
      "createdAt",
      "updatedAt",
      "name",
      "date",
      "status",
      idField,
    ]);
    const sort = allowedSortFields.has(sortField) ? requestedSort : defaultSort;
    const items = await Model.find(query).sort(sort).limit(500);
    res.json({
      success: true,
      data: items.map((item) => normalize(item, idField, transform)),
    });
  });

  const getOne = asyncHandler(async (req, res) => {
    const item = await Model.findOne(
      resourceQuery(req.tenantId, req.params.id, idField),
    );
    if (!item) throw new ApiError(404, "Resource not found");
    res.json({ success: true, data: normalize(item, idField, transform) });
  });

  const create = asyncHandler(async (req, res) => {
    let payload = sanitizePayload(req.body, idField);
    if (!payload[idField]) payload[idField] = generateCode(prefix);
    if (beforeCreate) payload = await beforeCreate(payload, req);
    payload.tenantId = req.tenantId;

    const item = await Model.create(payload);
    if (afterCreate) await afterCreate(item, req);
    res.status(201).json({
      success: true,
      message: "Created successfully",
      data: normalize(item, idField, transform),
    });
  });

  const update = asyncHandler(async (req, res) => {
    let payload = sanitizePayload(req.body, idField);
    if (beforeUpdate) payload = await beforeUpdate(payload, req);

    const item = await Model.findOneAndUpdate(
      resourceQuery(req.tenantId, req.params.id, idField),
      payload,
      { new: true, runValidators: true },
    );
    if (!item) throw new ApiError(404, "Resource not found");

    res.json({
      success: true,
      message: "Updated successfully",
      data: normalize(item, idField, transform),
    });
  });

  const remove = asyncHandler(async (req, res) => {
    if (beforeRemove) await beforeRemove(req);
    const item = await Model.findOneAndDelete(
      resourceQuery(req.tenantId, req.params.id, idField),
    );
    if (!item) throw new ApiError(404, "Resource not found");
    res.json({ success: true, message: "Deleted successfully" });
  });

  return { list, getOne, create, update, remove };
}
