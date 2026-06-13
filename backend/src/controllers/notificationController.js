import mongoose from "mongoose";

import Notification from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createCrudController } from "./crudController.js";

export const notificationController = createCrudController({
  Model: Notification,
  idField: "notificationId",
  prefix: "N",
  searchFields: ["title", "body", "category"],
});

function notificationQuery(req) {
  const conditions = [{ notificationId: req.params.id }];
  if (mongoose.isValidObjectId(req.params.id)) {
    conditions.push({ _id: req.params.id });
  }
  return { tenantId: req.tenantId, $or: conditions };
}

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { tenantId: req.tenantId, read: false },
    { read: true },
  );
  res.json({ success: true, message: "All notifications marked as read" });
});

export const setNotificationRead = asyncHandler(async (req, res) => {
  if (typeof req.body.read !== "boolean") {
    throw new ApiError(400, "Read status is required");
  }
  const item = await Notification.findOneAndUpdate(
    notificationQuery(req),
    { read: req.body.read },
    { new: true, runValidators: true },
  );
  if (!item) throw new ApiError(404, "Notification not found");
  const data = item.toJSON();
  data.mongoId = data.id;
  data.id = data.notificationId;
  res.json({
    success: true,
    message: req.body.read ? "Notification marked as read" : "Notification marked as unread",
    data,
  });
});

export const clearReadNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({
    tenantId: req.tenantId,
    read: true,
  });
  res.json({
    success: true,
    message: "Read notifications cleared",
    data: { deletedCount: result.deletedCount },
  });
});
