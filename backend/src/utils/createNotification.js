import Notification from "../models/Notification.js";
import { generateCode } from "./generateCode.js";

export async function createNotification({
  tenantId,
  type = "info",
  category = "system",
  title,
  body,
  actionUrl,
}) {
  try {
    return await Notification.create({
      tenantId,
      notificationId: generateCode("N"),
      type,
      category,
      title,
      body,
      actionUrl,
    });
  } catch (error) {
    console.error("Could not create notification:", error.message);
    return null;
  }
}
