import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createCrudController } from "./crudController.js";

export const notificationController = createCrudController({
  Model: Notification,
  idField: "notificationId",
  prefix: "N",
  searchFields: ["title", "body"],
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { tenantId: req.tenantId, read: false },
    { read: true },
  );
  res.json({ success: true, message: "All notifications marked as read" });
});
