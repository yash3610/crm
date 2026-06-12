import Setting from "../models/Setting.js";
import Tenant from "../models/Tenant.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const allowedSettingKeys = new Set([
  "company",
  "tax",
  "billing",
  "notifications",
  "appearance",
]);

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find({ tenantId: req.tenantId });
  const data = Object.fromEntries(
    settings.map((item) => [item.key, item.value]),
  );
  res.json({ success: true, data });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const entries = Object.entries(req.body);
  if (
    !entries.length ||
    entries.some(
      ([key, value]) =>
        !allowedSettingKeys.has(key) ||
        !value ||
        typeof value !== "object" ||
        Array.isArray(value),
    )
  ) {
    throw new ApiError(400, "Invalid settings payload");
  }

  await Promise.all(
    entries.map(([key, value]) =>
      Setting.findOneAndUpdate(
        { tenantId: req.tenantId, key },
        { tenantId: req.tenantId, value },
        { upsert: true, new: true, runValidators: true },
      ),
    ),
  );

  if (req.body.company?.name) {
    await Tenant.findByIdAndUpdate(req.tenantId, {
      name: req.body.company.name,
    });
  }

  res.json({ success: true, message: "Settings saved", data: req.body });
});
