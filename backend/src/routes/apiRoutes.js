import express, { Router } from "express";

import { getDashboard } from "../controllers/dashboardController.js";
import {
  getNextInvoiceNumber,
  invoiceController,
} from "../controllers/invoiceController.js";
import {
  adjustStock,
  getInventory,
} from "../controllers/inventoryController.js";
import {
  clearReadNotifications,
  markAllRead,
  notificationController,
  setNotificationRead,
} from "../controllers/notificationController.js";
import {
  customerController,
  expenseController,
  paymentController,
  productController,
  purchaseController,
  getNextPurchaseNumber,
  recordPurchasePayment,
  quotationController,
  supplierController,
} from "../controllers/resourceControllers.js";
import {
  getSettings,
  uploadSettingFile,
  updateSettings,
} from "../controllers/settingsController.js";
import { userController } from "../controllers/userController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { createCrudRouter } from "./crudRoutes.js";

const router = Router();

router.use(protect);
router.get("/dashboard", getDashboard);
router.use(
  "/customers",
  createCrudRouter(customerController, {
    writeRoles: ["Owner", "Admin", "Accountant", "Sales"],
    deleteRoles: ["Owner", "Admin"],
  }),
);
router.use(
  "/suppliers",
  createCrudRouter(supplierController, {
    writeRoles: ["Owner", "Admin", "Accountant"],
  }),
);
router.use("/products", createCrudRouter(productController));
router.get("/invoices/next-number", getNextInvoiceNumber);
router.use(
  "/invoices",
  createCrudRouter(invoiceController, {
    writeRoles: ["Owner", "Admin", "Accountant", "Sales"],
    deleteRoles: ["Owner", "Admin", "Accountant"],
  }),
);
router.use(
  "/payments",
  createCrudRouter(paymentController, {
    writeRoles: ["Owner", "Admin", "Accountant"],
  }),
);
router.use(
  "/expenses",
  createCrudRouter(expenseController, {
    writeRoles: ["Owner", "Admin", "Accountant"],
  }),
);
router.use(
  "/quotations",
  createCrudRouter(quotationController, {
    writeRoles: ["Owner", "Admin", "Accountant", "Sales"],
    deleteRoles: ["Owner", "Admin"],
  }),
);
router.get("/purchases/next-number", getNextPurchaseNumber);
router.post(
  "/purchases/:id/pay",
  allowRoles("Owner", "Admin", "Accountant"),
  recordPurchasePayment,
);
router.use(
  "/purchases",
  createCrudRouter(purchaseController, {
    writeRoles: ["Owner", "Admin", "Accountant"],
  }),
);
router.use(
  "/users",
  allowRoles("Owner", "Admin"),
  createCrudRouter(userController),
);
router.get("/inventory", getInventory);
router.post("/inventory/adjust", allowRoles("Owner", "Admin"), adjustStock);
router.patch("/notifications/read-all", markAllRead);
router.delete("/notifications/read", clearReadNotifications);
router.patch("/notifications/:id/read", setNotificationRead);
router.use(
  "/notifications",
  createCrudRouter(notificationController, {
    writeRoles: ["Owner", "Admin"],
    deleteRoles: ["Owner", "Admin", "Accountant", "Sales", "Viewer"],
  }),
);
router.get("/settings", getSettings);
router.post(
  "/settings/files/:section/:field",
  allowRoles("Owner", "Admin"),
  express.raw({
    type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    limit: "5mb",
  }),
  uploadSettingFile,
);
router.put("/settings", allowRoles("Owner", "Admin"), updateSettings);

export default router;
